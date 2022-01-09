import { assert, assertEquals } from "https://deno.land/std@0.119.0/testing/asserts.ts";

const defaultStateName = "test";
const defaultWriterName = "testWriter";

let prevValue, nextValue, writerName;
const verifyStateChange = (p, n, w) => {
    prevValue = p;
    nextValue = n;
    writerName = w;
};

let importCounter = 0;
let getTestStateManager = async () => {
    let stateManagerModule = await import(
        `../lib/stateManager.js?${importCounter++}`
    );
    return stateManagerModule.default;
}

Deno.test("changing-number-value-should-trigger-subscription", async () => {
    const stateManager = await getTestStateManager();

    let testState = stateManager.getState(defaultStateName, defaultWriterName);
    stateManager.subscribe(defaultStateName, verifyStateChange);

    testState.numberField = 10;

    assert(testState.numberField == 10);
    assertEquals(prevValue, {});
    assertEquals(nextValue, { numberField: 10 });
    assertEquals(writerName, defaultWriterName);
});

Deno.test("changing-string-value-should-trigger-subscription", async () => {
    const stateManager = await getTestStateManager();
    const testStringValue = "Sample string value";

    let testState = stateManager.getState(defaultStateName, defaultWriterName);

    testState.stringValue = testStringValue;

    assert(testState.stringValue == testStringValue);
    assertEquals(prevValue, {});
    assertEquals(nextValue, { stringValue: testStringValue });
    assertEquals(writerName, defaultWriterName);
});

Deno.test("changing-array-value-should-trigger-subscription", async () => {
    const stateManager = await getTestStateManager();
    const testStringValue = "Sample string value";

    let testState = stateManager.getState(defaultStateName, defaultWriterName);

    testState.arrayValue = [ "value1" ];;

    assertEquals(testState.arrayValue, [ "value1" ]);
    assertEquals(prevValue, {});
    assertEquals(nextValue, { arrayValue: [ "value1"] });
    assertEquals(writerName, defaultWriterName);
});

//Deno.test("changing-nested-object-should-trigger-subscription");
//Deno.test("changing-property-without-writername-should-fail");
//Deno.test("non-string-statename-provided-should-fail");
//Deno.test("multiple-subscriptions-added-should-trigger-all");
//Deno.test("non-string-statename-provided-should-fail");
//Deno.test("non-function-for-subscribe-should-fail");
//Deno.test("unsubscribing-should-not-call-subscription");
//Deno.test("deleting-state-should-remove-data-and-subscriptions");
//Deno.test("get-states-with-1-states-should-return-1");
//Deno.test("get-states-with-2-states-should-return-2");
//Deno.test("replace-should-replace-and-run-subscriptions");
//Deno.test("replace-with-invalid-object-should-fail");
//Deno.test("replace-with-nonexisting-state-name-should-fail");
//Deno.test("replaceone-with-nonstring-name-should-fail");
//Deno.test("replaceone-should-replace-state");

