import examples from './examples.js';
import generatePipeLine from './pipeline.js';

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
        errorMessage.innerHTML = `Your browser doesn't support the Prompt API. If you're on Chrome, join the <a href="https://developer.chrome.com/docs/ai/built-in#get_an_early_preview">Early Preview Program</a> to enable it.`;
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
                (index) => {
                    generateProgressBar.children[0].style.width = `${(index + 1) * 100 / generatePipeLine.length}%`;
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

async function runPipeline(
    passwordRules,
    updateProgressBarFunc,
    showSuccessFunc,
    showFailedFunc,
) {
    let contexts = {
        passwordRules: passwordRules,
    };

    let isError = false;
    for (const [index, pipe] of generatePipeLine.entries()) {
        const result = await pipe(contexts);
        console.debug(structuredClone(result));
        if (result.error) {
            isError = true;
            showFailedFunc(result.error);
            break;
        }
        contexts = result.contexts;

        updateProgressBarFunc(index);
    }

    if (!isError) {
        showSuccessFunc(contexts.password);
    }
}

window.runTests = function () {
    console.log('testA');
}
