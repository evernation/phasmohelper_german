const nightmareToggle = document.querySelector("#nightmare-toggle")!;
const hideExcludedToggle = document.querySelector("#hide-excluded-toggle")!;
const resetButton = document.querySelector("#reset")!;

const possessionButtons = document.querySelectorAll("#possession-buttons > .toggle");
const possessionHints = document.querySelectorAll("#possession-hints > *");

const evidenceButtons = document.querySelectorAll<HTMLElement>("#evidence-buttons .button");
const ghosts = document.querySelectorAll(".ghost");
const ghostEvidences = document.querySelectorAll(".ghost .evidence");
const ghostSheet = document.querySelector("#journal-minimap")!;

const body = document.body;
const bottomContent = document.querySelector<HTMLElement>("#bottom-content")!;

if (readCookie("hide-excluded-toggle") === "True") {
    body.classList.add("hide-excluded-toggle")
    hideExcludedToggle.classList.add("active");
}

evidenceButtons.forEach(button => {
    button.title = 'Left-click to include.\nRight-click to exclude.';
});

function writeCookie(name: string, value: string) {
    const d = new Date();
    d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000));
    const expires = d.toUTCString();
    document.cookie = name + "=" + value + ";" + "expires=" + expires + ";path=/";
}

function readCookie(name: string) {
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

function reset() {
    ghosts.forEach(ghost => ghost.classList.remove("disabled", "positive", "excluded", "manual-excluded"));
    ghostEvidences.forEach(evidence => evidence.querySelectorAll("li").forEach(child => child.classList.remove("positive", "negative")));
    evidenceButtons.forEach(button => button.classList.remove("disabled", "positive", "negative"));
    body.classList.remove("positive", "negative");
    ghostSheet.classList.add("disabled");
}

resetButton.addEventListener("click", reset);

document.addEventListener("keypress", function (e) {
    if (e.key === "r") {
        reset();
    }
});

document.querySelectorAll(".toggle").forEach(toggle => {
    toggle.addEventListener("click", () => {
        toggle.classList.toggle("active");
    });
})

nightmareToggle.addEventListener("click", function () {
    body.classList.toggle("nightmare");
    updateGhosts();
});

function updateGhosts() {
    const foundEvidence = Array.from(document.querySelectorAll("#evidence-buttons .button.positive[data-evidence]")).map(e => e.getAttribute("data-evidence"));
    const foundExtras = Array.from(document.querySelectorAll("#evidence-buttons .button.positive[data-evidence-extra]")).map(e => e.getAttribute("data-evidence-extra"));
    const nightmare = nightmareToggle.classList.contains("active");

    // Check the evidence list of each ghost
    // Hide any ghosts that do not contain all currently discovered evidence
    // Fade any ghosts that can be ruled out based on excluded evidence
    ghostEvidences.forEach(evidence => {
        const ghost= evidence.closest(".ghost")!;
        const requiredEvidence= evidence.querySelector<HTMLElement>("[required]");

        const positives = evidence.querySelectorAll('.positive[data-evidence]');
        const negatives = evidence.querySelectorAll('.negative[data-evidence]');
        const positivesExtra = evidence.querySelectorAll('.positive[data-evidence-extra]');
        const negativesExtra = evidence.querySelectorAll('.negative[data-evidence-extra]');
        const negativesRequired = evidence.querySelectorAll('.negative[required]');
        
        ghost.classList.remove("excluded");
        
        if (nightmare && foundEvidence.length === 2 && requiredEvidence != null && !requiredEvidence.classList.contains("positive")) {
            ghost.classList.add("disabled");
        } else if (positives.length !== foundEvidence.length) {
            ghost.classList.add("disabled");
        } else if (positivesExtra.length !== foundExtras.length) {
            ghost.classList.add("disabled");
        } else if (negatives.length > (nightmare ? 1 : 0) || negativesRequired.length > 0 || negativesExtra.length > 0) {
            // In nightmare difficulty one piece of evidence is hidden, so a ghost can only be ruled out if
            // two pieces of evidence are excluded OR if a required piece of evidence is excluded
            ghost.classList.add("excluded");
            ghost.classList.remove("disabled");
        } else {
            ghost.classList.remove("disabled");
        }

        if (requiredEvidence != null)
            requiredEvidence.title = nightmare ? 'In nightmare difficulty, this piece of evidence is guaranteed for this ghost.' : '';
    });

    document.querySelectorAll(".ghost.manual-excluded").forEach(ghost => ghost.classList.add("excluded"));

    const validEvidence = Array.from(document.querySelectorAll(".ghost:not(.disabled):not(.excluded) .evidence li"))
        .map(e => e.getAttribute("data-evidence") ?? e.getAttribute("data-evidence-extra"))
        .filter((value, index, self) => self.indexOf(value) === index);

    const excludedEvidence = Array.from(document.querySelectorAll(".ghost:not(.disabled).excluded .evidence li.negative"))
        .map(e => e.getAttribute("data-evidence") ?? e.getAttribute("data-evidence-extra"))
        .filter((value, index, self) => self.indexOf(value) === index);

    document.querySelectorAll<HTMLElement>("#evidence-buttons .button:not(.positive)").forEach(evidenceButton => {
        const evidence = evidenceButton.dataset.evidence ?? evidenceButton.dataset.evidenceExtra;
        if (!validEvidence.includes(evidence!) && !excludedEvidence.includes(evidence!))
            evidenceButton.classList.add("disabled");
        else
            evidenceButton.classList.remove("disabled");
    });
    
    const remainingGhosts = document.querySelectorAll(".ghost:not(.excluded):not(.disabled)");
    if (remainingGhosts.length === 0) {
        body.classList.remove("positive");
        body.classList.add("negative");
        ghostSheet.classList.add("disabled");
    }
    else if (remainingGhosts.length === 1) {
        remainingGhosts[0].classList.add("positive");
        body.classList.remove("negative");
        body.classList.add("positive");
        ghostSheet.classList.remove("disabled");

        const ghostName = remainingGhosts[0].querySelector("h3")!.textContent!;
        const ghostSheetCells = ghostSheet.querySelectorAll("td");
        for (const ghostSheetCell of ghostSheetCells) {
            if (ghostSheetCell.textContent === ghostName) {
                ghostSheetCell.classList.add("positive");
            }
            else {
                ghostSheetCell.classList.remove("positive");
            }
        }
    }
    else {
        remainingGhosts.forEach(ghost => ghost.classList.remove("positive"));
        body.classList.remove("positive", "negative");
        ghostSheet.classList.add("disabled");
    }
}

possessionButtons.forEach((button, i) => button.addEventListener("click", function () {
    for (const possessionButton of possessionButtons)
        if (possessionButton !== button)
            possessionButton.classList.remove("active");

    possessionHints.forEach(possessionHint => possessionHint.classList.add("disabled"));

    const container = document.querySelector("#possession-hints")!;
    container.classList.add("disabled");
    bottomContent.style.marginTop = "0px";

    if (button.classList.contains("active"))
    {
        possessionHints[i].classList.remove("disabled");
        container.classList.remove("disabled");
        bottomContent.style.marginTop = (container.clientHeight) + "px";
    }
}));

hideExcludedToggle.addEventListener("click", function () {
    if (body.classList.contains("hide-excluded-toggle")) {
        body.classList.remove("hide-excluded-toggle");
        writeCookie("hide-excluded-toggle", "False")
    } else {
        body.classList.add("hide-excluded-toggle");
        writeCookie("hide-excluded-toggle", "True")
    }

    updateGhosts();
});

evidenceButtons.forEach(button => button.addEventListener("click", function () {
    let changedGhostEvidences;
    let changedEvidence = button.dataset.evidence;
    if (changedEvidence != null)
        changedGhostEvidences = document.querySelectorAll(`.evidence > li[data-evidence=${changedEvidence}]`);
    else {
        changedEvidence = button.dataset.evidenceExtra;
        changedGhostEvidences = document.querySelectorAll(`.evidence > li[data-evidence-extra=${changedEvidence}]`);
    }

    if (!button.classList.contains("positive")) {
        button.classList.remove("negative");
        button.classList.add("positive");
        changedGhostEvidences.forEach(ghostEvidence => ghostEvidence.classList.add("positive"));
    } else {
        button.classList.remove("positive", "negative");
        changedGhostEvidences.forEach(ghostEvidence => ghostEvidence.classList.remove("positive", "negative"));
    }

    updateGhosts();
}));

evidenceButtons.forEach(button => button.addEventListener("contextmenu", function (e) {
    e.preventDefault();

    let changedGhostEvidences;
    let changedEvidence = button.dataset.evidence;
    if (changedEvidence != null)
        changedGhostEvidences = document.querySelectorAll(`.evidence > li[data-evidence=${changedEvidence}]`);
    else {
        changedEvidence = button.dataset.evidenceExtra;
        changedGhostEvidences = document.querySelectorAll(`.evidence > li[data-evidence-extra=${changedEvidence}]`);
    }

    if (!button.classList.contains("negative")) {
        button.classList.remove("positive");
        button.classList.add("negative");
        changedGhostEvidences.forEach(ghostEvidence => ghostEvidence.classList.remove("positive"));
        changedGhostEvidences.forEach(ghostEvidence => ghostEvidence.classList.add("negative"));
    } else {
        button.classList.remove("positive", "negative");
        changedGhostEvidences.forEach(ghostEvidence => ghostEvidence.classList.remove("positive", "negative"));
    }

    updateGhosts();
}));

const ghostHeaders = document.querySelectorAll<HTMLElement>(".ghost h3");
ghostHeaders.forEach(header => header.addEventListener("click", function () {
    header.closest(".ghost")?.classList.toggle("manual-excluded");
    updateGhosts();
}));

ghostHeaders.forEach(header => header.addEventListener("contextmenu", function (e) {
    e.preventDefault();
    header.closest(".ghost")?.classList.toggle("manual-excluded");
    updateGhosts();
}));

ghostHeaders.forEach(header => {
    header.title = 'Click to exclude.';
});