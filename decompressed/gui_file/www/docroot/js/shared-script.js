var KoRequest = {};
var connectionissue = 0;

var modgui = modgui || {};
!function (module) {
	
	function postAction(action,logModal) {
		var target = $(".modal form").attr("action");
		$.post(
			target, {
				action: action,
				CSRFtoken: $("meta[name=CSRFtoken]").attr("content")
			},
			null,
			"json"
		);
		logModal && tch.openModal("/modals/command-log-read-modal.lp");
		return false;
	}
	
	var intervalAjaxScript;
	var scriptRequestTimeout = 1000;
	
	function scriptRequestStatusAjax(type) {
		if (intervalAjaxScript) return;
		if (type == "checkver") post("checkver");
		intervalAjaxScript = setInterval(function () {
			$.ajax({
					url: "modals/modgui-modal.lp",
					data: "action=scriptRequestStatus" + "&auto_update=true",
					timeout: scriptRequestTimeout,
					cache: false,
					dataType: "json"
				})
				.done(function (data) {
					if (data.state == "Complete") {
						if ((type == "checkver") && (data.new_version_text)) {
							var outdated_ver = gui_var.gui_outdated;
							var no_new = gui_var.gui_updated;
							$(".gui_version_status_text").parent().fadeOut().fadeIn();
							if (data.new_version_text == "Unknown") {
								$(".gui_version_status").removeClass("yellow");
								$(".gui_version_status").addClass("green");
								$(".gui_version_status_text").text(no_new);
								$("#upgrade-alert").addClass("hide");
							} else {
								$(".gui_version_status").removeClass("green");
								$(".gui_version_status").addClass("yellow");
								$("#upgradebtn").removeClass("hide");
								$(".gui_version_status_text").text(outdated_ver);
								$("#upgrade-alert").removeClass("hide");
								$("#new-version-text").text(data.new_version_text);
							}
							$(".check_update_spinner").removeClass("fa-spin");
							clearInterval(intervalAjaxScript);
							intervalAjaxScript = null;
						} else {
							window.location.href = "/";
						}
					}
				});
		}, scriptRequestTimeout);
	}
	
	function createAjaxUpdateCard(CardIdRefresh, ajaxLink, IntervalVar, RefreshTime, CustomRefreshFunction) {
		
		var element = document.getElementById(CardIdRefresh);
		if (!element) return ;
		
		var ElementBinding = {};
		var ElementBindingList = [];
		var ObserveElement;
		$("#" + CardIdRefresh).find("[data-bind]").each(function () {
			ObserveElement = $(this).data("bind").split(":")[1].trim();
			ElementBindingList.push(ObserveElement);
			ElementBinding[ObserveElement] = ko.observable();
		});
	
		var arrayLength = ElementBindingList.length;
	
		var AjaxRefresh = ( typeof CustomRefreshFunction === "function" ) && CustomRefreshFunction || function() {
			var updateLink = "auto_update=true";
			if ( /[a-z]+=[a-z]+/.test(ajaxLink) ) {
				updateLink = "&" + updateLink;
			} else {
				updateLink = "?" + updateLink;
			};
			$.post(ajaxLink + updateLink, [tch.elementCSRFtoken()], function (data) {
				for (var i = 0; i < arrayLength; i++) {
					if (data[ElementBindingList[i]] != undefined) {
						ElementBinding[ElementBindingList[i]](data[ElementBindingList[i]]);
					}
				}
			}, "json")
				.done(function(data) {
					if(connectionissue==1) {
						if ($("#popUp").is(":visible"))
							tch.removeProgress();
						connectionissue = 0;
					}
				})
				.fail(function(data) {
					connectionissue = 1;
					if(data.status==200 && data.responseText.includes("sign-me-in")){
						if(!$("#popUp").is(":visible"))
							tch.showProgress(loginMsg);
						window.location.href = "/";
					}
					if(!$("#popUp").is(":visible"))
						tch.showProgress(connectionLost + " " + data.statusText);
				});
		};
		
		AjaxRefresh(ElementBinding);
		
		if (!ko.dataFor(element))
			ko.applyBindings(ElementBinding, element);
		KoRequest[IntervalVar] = setInterval(AjaxRefresh,RefreshTime,ElementBinding);
	}
	
	function linkCheckUpdate() {
		$(".check_update").on("click", function (e) {
			e.stopPropagation();
			postAction("checkver");
			$(".check_update_spinner").addClass("fa-spin");
			KoRequest.CheckVer = setInterval(function () {
				$.ajax({
					url: "modals/modgui-modal.lp",
					data: "action=scriptRequestStatus" + "&auto_update=true",
					timeout: scriptRequestTimeout,
					cache: false,
					dataType: "json"
				})
				.done(function (data) {
					if (data.state == "Complete") {
						if (data.new_version_text) {
							var outdated_ver = gui_var.gui_outdated;
							var no_new = gui_var.gui_updated;
							$(".gui_version_status_text").parent().fadeOut().fadeIn();
							if (data.new_version_text == "Unknown") {
								$(".gui_version_status").removeClass("yellow");
								$(".gui_version_status").addClass("green");
								$(".gui_version_status_text").text(no_new);
								$("#upgrade-alert").addClass("hide");
							} else {
								$(".gui_version_status").removeClass("green");
								$(".gui_version_status").addClass("yellow");
								$("#upgradebtn").removeClass("hide");
								$(".gui_version_status_text").text(outdated_ver);
								$("#upgrade-alert").removeClass("hide");
								$("#new-version-text").text(data.new_version_text);
							}
							$(".check_update_spinner").removeClass("fa-spin");
							clearInterval(KoRequest.CheckVer);
							KoRequest.CheckVer = null;
						}
					}
				});
			}, scriptRequestTimeout);
		})
	};
	
	function freshStyle(stylesheet) {
		$("#theme_skin").attr("href", "/theme/" + stylesheet);
	}
	
	function scrollFunction() {
		if (document.body.scrollTop > 60 || document.documentElement.scrollTop > 60) {
			$("#scroll-up").removeClass("hide");
			$("#scroll-down").addClass("hide");
		} else {
			$("#scroll-up").addClass("hide");
			$("#scroll-down").removeClass("hide");
		}
	}
	
	module.postAction = postAction,
	module.scriptRequestStatusAjax = scriptRequestStatusAjax,
	module.createAjaxUpdateCard = createAjaxUpdateCard,
	module.linkCheckUpdate = linkCheckUpdate,
	module.freshStyle = freshStyle,
	module.scrollFunction = scrollFunction
}
(modgui);

window.onscroll = function () {
	modgui.scrollFunction()
};

$(function () {
	$("a[href*=\'#\']").on("click", function (e) {
		e.preventDefault();
		$("html, body").animate({
			scrollTop: $($(this).attr("href")).offset().top
		}, 500, "linear");
	});

	if (gui_var.randomcolor == "1") {
		setInterval(function () {
			var colorR = Math.floor((Math.random() * 256));
			var colorG = Math.floor((Math.random() * 256));
			var colorB = Math.floor((Math.random() * 256));
			$(":root").get(0).style.setProperty("--first-color-accent", "rgb(" + colorR + "," + colorG + "," + colorB + ")");
			$(":root").get(0).style.setProperty("--first-color-accent-50", "rgba(" + colorR + "," + colorG + "," + colorB + ", 0.5)");
			$(":root").get(0).style.setProperty("--first-color-accent-80", "rgba(" + colorR + "," + colorG + "," + colorB + ", 0.8)");
		}, 750);
	}
	
	var pathname = document.location.pathname;
	var page = gui_var.pageselector_page;
	var text = gui_var.pageselector_text;
	
	if (pathname == "/stats.lp") {
		$("#cards-text").text(gui_var.cards_text);
		document.title = "Gateway - "+gui_var.stats_text;
	} else if (pathname == "/cards.lp") {
		$("#cards-text").text(gui_var.stats_text);
		document.title = "Gateway - "+gui_var.cards_text;
	} else if (pathname == "/" ) {
		document.title = "Gateway - "+gui_var.pageselector_othertext;
	}
	
	$("#swtichbuttom").on("click", function () {
		var pathname = document.location.pathname;
		var text = gui_var.pageselector_othertext;
		var view = gui_var.pageselector_text;
		
		if (pathname == "/stats.lp") {
			page = "cards.lp";
			text = gui_var.stats_text;
			view = gui_var.cards_text;
		} else if (pathname == "/cards.lp") {
			page = "stats.lp";
			text = gui_var.cards_text;
			view = gui_var.stats_text;
		}
		
		$("#cards-text").text(openMsg);
		$("#refresh-cards").show();
		$("#refresh-cards").css("margin-right", "5px");
		$("#refresh-cards").addClass("fa fa-sync fa-spin");
		Object.keys(KoRequest).forEach(function(interval) {
			clearInterval(KoRequest[interval])
		});
		KoRequest = {};

		$.get(page + "?contentonly=true").done(function (data) {
			$(".dynamic-content").replaceWith(data);
			$("#cards-text").text(text);
			$("#refresh-cards").hide();
			window.history.pushState("gateway", "Gateway - "+view, page);
			document.title = "Gateway - "+view;
			$("#swtichbuttom").trigger("switchcard");
		});
	});
	$("#upgradebtn").on("hover",
		function () {
			$("#upgradebtn").css("color", "white");
		},
		function () {
			$("#upgradebtn").css("color", "orangered");
		}
	);
	
	if ((gui_var.autoupgradeview != "") && (gui_var.autoupgradeview != "none")) {
		modgui.postAction("autoupgrade_view");
	};
	
	if ( gui_var.gui_animation == "1" ) {
		AOS.init();
	};
});

$(document).ready(function () {
	ko.bindingHandlers.text = {
		init: function (element, valueAccessor) {
			$(element).text(ko.unwrap(valueAccessor()));
		},
		update: function (element, valueAccessor) {
			var value = ko.unwrap(valueAccessor());
			if (value != $(element).text()) {
				if (!$(element).hasClass("hide") && gui_var.gui_animation == "1") {
					$(element).fadeOut(function () {
						$(this).text(value).fadeIn();
					});
				} else {
					$(element).text(value);
				}
			}
		}
	};
	ko.bindingHandlers.log_text = {
		init: function (element, valueAccessor) {
			$(element).text(ko.unwrap(valueAccessor()));
		},
		update: function (element, valueAccessor) {
			var value = ko.unwrap(valueAccessor());
			if (value != $(element).text()) {
				if (!$(element).hasClass("hide") && gui_var.gui_animation == "1") {
					$(element).fadeOut(function () {
						$(this).text(value).fadeIn();
					});
				} else {
					$(element).text(value);
				}
				$(element).parent().parent().parent().animate({scrollTop: $(element).parent().parent().parent()[0].scrollHeight}, 600);
			}
		}
	};
	ko.bindingHandlers.html = {
		init: function (element, valueAccessor) {
			$(element).html(ko.unwrap(valueAccessor()));
		},
		update: function (element, valueAccessor) {
			var value = ko.unwrap(valueAccessor());
			if (value != $(element).html()) {
				if (!$(element).hasClass("hide") && gui_var.gui_animation == "1") {
					$(element).fadeOut(function () {
						$(this).html(value).fadeIn();
					});
				} else {
					$(element).html(value);
				}
			}
		}
	};
});