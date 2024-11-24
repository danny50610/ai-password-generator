import examples from './examples.js';
import runPipeline from './pipeline.js';
import './test.js';

(async () => {
    const errorMessage = document.getElementById("error-message");
    
    const examplesSelect = document.getElementById("examples-select");
    const passwordRulesInput = document.getElementById("password-rules-input");
    const generateButton = document.getElementById("generate");
    const generateProgressBar = document.getElementById("generate-progressbar");

    const resultBlock = document.getElementById("result");
    const passwordCode = document.getElementById("password");
    const passwordCopyButton = document.getElementById("copy-password");
    const generateSuccess = document.getElementById("generate-success");
    const generateFailed = document.getElementById("generate-failed");
    const passwordFailedMessage = document.getElementById("password-failed-message");

    if (!self.ai || !self.ai.languageModel) {
        errorMessage.style.display = "block";
        errorMessage.innerHTML = "Your browser doesn't support the Prompt API.";
        return;
    }

    if (!('translation' in self && 'canDetect' in self.translation && 'createTranslator' in self.translation)) {
        // chrome://flags/#language-detection-api
        // chrome://flags/#translation-api
        errorMessage.style.display = "block";
        errorMessage.innerHTML = "Your browser doesn't support the Translation API";
        return;
    }

    const canDetect = await translation.canDetect();
    if (canDetect === 'no') {
        errorMessage.style.display = "block";
        errorMessage.innerHTML = "Your browser doesn't support the Translation API";
        return;
    } else if (canDetect === 'after-download') {
        errorMessage.style.display = "block";
        errorMessage.innerHTML = "Please wait browse download the translation model";
        return;
    }

    const capabilities = await ai.languageModel.capabilities();
    console.log(capabilities);

    examples.forEach((example, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.text = example.value;
        examplesSelect.appendChild(option);
    });

    examplesSelect.addEventListener("change", function (event) {
        passwordRulesInput.value = examples[event.target.value].value;
    });

    const clearResult = () => {
        resultBlock.style.display = "none";

        generateSuccess.style.display = "none";
        generateFailed.style.display = "none";

        generateProgressBar.children[0].style.width = "0%";
    }

    const showSuccess = (password) => { 
        resultBlock.style.display = "block";

        passwordCode.innerText = password;
        generateSuccess.style.display = "block";
    }

    const showFailed = (message) => {
        resultBlock.style.display = "block";

        passwordFailedMessage.innerText = message;
        generateFailed.style.display = "block";
    }

    generateButton.addEventListener("click", async () => {
        generateButton.disabled = true;
        generateButton.innerHTML = 'Generating <i class="fa-solid fa-spinner fa-spin-pulse"></i>';

        clearResult();

        try {
            const passwordRules = passwordRulesInput.value.trim();

            await runPipeline(
                passwordRules,
                (index, total) => {
                    generateProgressBar.children[0].style.width = `${(index + 1) * 100 / total}%`;
                },
                showSuccess,
                showFailed,
            );
        } finally { 
            generateButton.disabled = false;
            generateButton.innerHTML = 'Generate ✨';
        }
    });

    passwordCopyButton.addEventListener("click", () => {
        navigator.clipboard.writeText(passwordCode.innerText)
            .then(() => {
                alert('Password copied to clipboard');
            })
            .catch((err) => {
                alert(err);
            });
    });
})();
