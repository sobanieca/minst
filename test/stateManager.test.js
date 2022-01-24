import {
  assert,
  assertEquals,
  assertThrows
} from "https://deno.land/std@0.119.0/testing/asserts.ts";

const defaultStateName = "test";
const defaultWriterName = "testWriter";

let importCounter = 0;
const getTestStateManager = async () => {
  const stateManagerModule = await import(
    `../lib/stateManager.js?${importCounter++}`
  );
  return stateManagerModule.default;
};

const getState = async (stateName, writerName) => {
  const stateManager = await getTestStateManager();
  const testState = stateManager.getState(stateName, writerName);

  const stateChangeData = {};
  const verifyStateChange = (p, n, w) => {
    stateChangeData.prevValue = p;
    stateChangeData.nextValue = n;
    stateChangeData.writerName = w;
  };

  stateManager.subscribe(defaultStateName, verifyStateChange);

  return { stateManager, testState, stateChangeData };
};

Deno.test("changing-number-value-should-trigger-subscription", async () => {
  const { testState, stateChangeData } = await getState(
    defaultStateName,
    defaultWriterName,
  );
  testState.numberField = 10;

  assert(testState.numberField == 10);
  assertEquals(stateChangeData.prevValue, {});
  assertEquals(stateChangeData.nextValue, { numberField: 10 });
  assertEquals(stateChangeData.writerName, defaultWriterName);
});

Deno.test("changing-string-value-should-trigger-subscription", async () => {
  const { testState, stateChangeData } = await getState(
    defaultStateName,
    defaultWriterName,
  );
  const testStringValue = "Sample string value";
  testState.stringValue = testStringValue;

  assert(testState.stringValue == testStringValue);
  assertEquals(stateChangeData.prevValue, {});
  assertEquals(stateChangeData.nextValue, { stringValue: testStringValue });
  assertEquals(stateChangeData.writerName, defaultWriterName);
});

Deno.test("changing-array-value-should-trigger-subscription", async () => {
  const { testState, stateChangeData } = await getState(
    defaultStateName,
    defaultWriterName,
  );
  testState.arrayValue = ["value1"];

  assert(testState.arrayValue.length == 1);
  assert(testState.arrayValue[0] == "value1");
  assertEquals(stateChangeData.prevValue, {});
  assertEquals(stateChangeData.nextValue, { arrayValue: ["value1"] });
  assertEquals(stateChangeData.writerName, defaultWriterName);
});

Deno.test("changing-nested-object-should-trigger-subscription", async () => {
  const { testState, stateChangeData } = await getState(
    defaultStateName,
    defaultWriterName,
  );
  testState.nestedObject = {};
  testState.nestedObject.value = "test";

  assert(testState.nestedObject.value == "test");
  assertEquals(stateChangeData.prevValue, { nestedObject: {} });
  assertEquals(stateChangeData.nextValue, { nestedObject: { value: "test" } });
  assertEquals(stateChangeData.writerName, defaultWriterName);
});

Deno.test("changing-property-without-writername-should-fail", async () => {
  const { testState, stateChangeData } = await getState(defaultStateName);

  assertThrows(() => testState.value = "value1", Error, "writerName");
});
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
