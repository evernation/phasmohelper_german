const nightmareToggle = $("#nightmare-toggle");
const hideExcludedToggle = $("#hide-excluded-toggle")

const possessionButtons = $("#possession-buttons").children();
const possessionHints = $("#possession-hints").children();

const evidenceButtons = $("#evidence-buttons .button");
const ghosts = $(".ghost");
const ghostEvidences = $(".ghost .evidence");

const body = $("body");
const bottomContent = $("#bottom-content");

function writeCookie(name, value) {
    const d = new Date();
    d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000));
    const expires = d.toUTCString();
    document.cookie = name + "=" + value + ";" + "expires=" + expires + ";path=/";
}

function readCookie(name) {
    const cname = name + "=";
    const dc = decodeURIComponent(document.cookie);
    const ca = dc.split(";");
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === " ") {
            c = c.substring(1);
        }
        if (c.indexOf(cname) === 0) {
            return c.substring(cname.length, c.length);
        }
    }
    return "";
}

function loadSettings() {
    if (readCookie("hide-excluded-toggle") === "True") {
        body.addClass("hide-excluded-toggle")
        hideExcludedToggle.addClass("active");
    }
}

function reset() {
    ghosts.removeClass("disabled positive excluded manual-excluded");
    ghostEvidences.children("li").removeClass("positive negative");
    evidenceButtons.removeClass("disabled positive negative");
    body.removeClass("positive negative");
}

$("#reset").on("click", reset);

$(document).on("keypress", function (e) {
    if (e.key === "r") {
        reset();
    }
});

$(".toggle").on("click", function () {
    $(this).toggleClass("active");
});

nightmareToggle.on("click", function () {
    body.toggleClass("nightmare");
    updateGhosts();
});

function updateGhosts() {
    const foundEvidence = $("#evidence-buttons .button.positive").map((i, e) => e.getAttribute("data-evidence")).get();
    const nightmare = nightmareToggle.hasClass("active");

    // Check the evidence list of each ghost
    // Hide any ghosts that do not contain all currently discovered evidence
    // Fade any ghosts that can be ruled out based on excluded evidence
    const negatives = $(".evidence .negative");
    const negativesRequired = $(".evidence .negative[required='true']");
    ghostEvidences.each(function () {
        const $this = $(this);
        const ghost = $this.parents(".ghost");

        ghost.removeClass("excluded");
        if ($this.children(".positive").length !== foundEvidence.length) {
            ghost.addClass("disabled");
        } else if ($this.find(negatives).length > (nightmare ? 1 : 0) || $this.find(negativesRequired).length > 0) {
            // In nightmare difficulty one piece of evidence is hidden, so a ghost can only be ruled out if
            // two pieces of evidence are excluded OR if a required piece of evidence is excluded
            ghost.addClass("excluded");
            ghost.removeClass("disabled");
        } else {
            ghost.removeClass("disabled");
        }
    });

    $(".ghost.manual-excluded").addClass("excluded");

    const validEvidence = $(".ghost:not(.disabled):not(.excluded) .evidence li")
        .map((i, e) => e.getAttribute("data-evidence")).get()
        .filter((value, index, self) => self.indexOf(value) === index);

    const excludedEvidence = $(".ghost:not(.disabled).excluded .evidence li.negative")
        .map((i, e) => e.getAttribute("data-evidence")).get()
        .filter((value, index, self) => self.indexOf(value) === index);

    $("#evidence-buttons .button:not(.positive)").each(function () {
        const $this = $(this);
        const evidence = $this.data("evidence");
        if (!validEvidence.includes(evidence) && !excludedEvidence.includes(evidence))
            $this.addClass("disabled");
        else
            $this.removeClass("disabled");
    });

    const ghost = $(".ghost:not(.excluded):not(.disabled)");
    if (ghost.length === 1) {
        ghost.addClass("positive");
    }
    else {
        ghost.removeClass("positive")
    }
}

possessionButtons.on("click", function () {
    possessionButtons.not(this).removeClass("active");

    possessionHints.addClass("disabled");
    
    const container = $("#possession-hints");
    container.addClass("disabled");
    bottomContent[0].style.marginTop = "0px";

    if ($(this).hasClass("active"))
    {
        possessionHints.eq(possessionButtons.index(this)).removeClass("disabled");
        container.removeClass("disabled");
        bottomContent[0].style.marginTop = (container[0].clientHeight) + "px";
    }
});

hideExcludedToggle.on("click", function () {
    if (body.hasClass("hide-excluded-toggle")) {
        body.removeClass("hide-excluded-toggle");
        writeCookie("hide-excluded-toggle", "False")
    } else {
        body.addClass("hide-excluded-toggle");
        writeCookie("hide-excluded-toggle", "True")
    }

    updateGhosts();
});

evidenceButtons.on("click", function () {
    const $this = $(this);
    const changedEvidence = $this.data("evidence");

    const changedGhosts = $(`.evidence > li[data-evidence=${changedEvidence}]`);

    if (!$this.hasClass("positive")) {
        $this.removeClass("negative");
        $this.addClass("positive");
        changedGhosts.removeClass("negative");
        changedGhosts.addClass("positive");
    } else {
        $this.removeClass("positive negative");
        changedGhosts.removeClass("positive negative");
    }

    updateGhosts();
});

evidenceButtons.on("contextmenu", function (e) {
    e.preventDefault();

    const $this = $(this);
    const changedEvidence = $this.data("evidence");

    const changedGhosts = $(`.evidence > li[data-evidence=${changedEvidence}]`);

    if (!$this.hasClass("negative")) {
        $this.removeClass("positive");
        $this.addClass("negative");
        changedGhosts.removeClass("positive");
        changedGhosts.addClass("negative");
    } else {
        $this.removeClass("positive negative");
        changedGhosts.removeClass("positive negative");
    }

    updateGhosts();
});

const ghostHeaders = $(".ghost h3");
ghostHeaders.on("click", function () {
    $(this).parents(".ghost").toggleClass("manual-excluded");
    updateGhosts();
});

ghostHeaders.on("contextmenu", function (e) {
    e.preventDefault();
    $(this).parents(".ghost").toggleClass("manual-excluded");
    updateGhosts();
});