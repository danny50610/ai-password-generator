import examples from './examples.js';
import runPipeline from './pipeline.js';

window.runTests = async function () {
    const testCases = [];
    for (let i = 0; i < examples.length; i++) {
        const example = examples[i];
        const passwordRules = example.value;
        const needTestValid = example.test.valid;

        const result = await runPipeline(
            passwordRules,
            (_) => {},
            (_) => {},
            (_) => {},
        );

        let testResult = undefined;
        if (needTestValid) {
            if (result.isError) {
                testResult = false;
            } else {
                const password = result.contexts.password;
                const asserts = example.test.asserts;

                let assertResult = true;
                for (let j = 0; j < asserts.length; j++) {
                    assertResult = assertResult && asserts[j](password);
                    if (!assertResult) {
                        console.log(`Test case ${i+1} failed at assert ${j+1}`);
                    }
                }
                testResult = assertResult;
            }
        } else {
            testResult = result.isError;
        }

        testCases.push({
            'passwordRules': passwordRules,
            'result': testResult,
        });

        if (testResult) {
            console.log(`Test case ${i+1} passed`);
        } else {
            console.log(`Test case ${i+1} failed`);
        }
    }

    console.table(testCases);
}