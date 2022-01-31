import {
  assert,
  assertEquals,
  assertRejects,
  assertThrows,
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

Deno.test("non-string-statename-provided-should-fail", async () => {
  await assertRejects(async () => await getState(123), Error, "string");
});

Deno.test("multiple-subscriptions-added-should-trigger-all", async () => {
  const { stateManager, testState, stateChangeData } = await getState(
    defaultStateName,
    defaultWriterName,
  );

  let val = 0;
  stateManager.subscribe(defaultStateName, () => {
    val = 10;
  });

  testState.valueTriggeringSubscription = 100;

  assertEquals(val, 10);
  assertEquals(stateChangeData.prevValue, {});
  assertEquals(stateChangeData.nextValue, { valueTriggeringSubscription: 100 });
  assertEquals(stateChangeData.writerName, defaultWriterName);
});

Deno.test("non-string-statename-provided-should-fail", async () => {
  await assertRejects(async () => await getState(123), Error, "string");
});

Deno.test("non-function-for-subscribe-should-fail", async () => {
  const { stateManager, testState, stateChangeData } = await getState(
    defaultStateName,
    defaultWriterName,
  );

  assertThrows(
    () => stateManager.subscribe(defaultStateName, "non-function-value"),
    Error,
    "function",
  );
});

Deno.test("unsubscribing-should-not-call-subscription", async () => {
  const { stateManager, testState } = await getState(
    defaultStateName,
    defaultWriterName,
  );

  let val = 0;

  const subscriptionId = stateManager.subscribe(defaultStateName, () => {
    val++;
  });

  testState.value = "abc";

  stateManager.unsubscribe(defaultStateName, subscriptionId);

  assertEquals(val, 1);
});

Deno.test("deleting-state-should-remove-data-and-subscriptions", async () => {
  let { stateManager, testState } = await getState(
    defaultStateName,
    defaultWriterName,
  );

  let subscriptionCallCount = 0;

  stateManager.subscribe(defaultStateName, () => subscriptionCallCount++);

  testState.numberField = 10;

  stateManager.deleteState(defaultStateName);

  testState = stateManager.getState(defaultStateName, defaultWriterName);

  assertEquals(testState.numberField, undefined);

  testState.anotherNumberField = 20;

  assertEquals(subscriptionCallCount, 1);
});

Deno.test("get-states-with-1-states-should-return-1", async () => {
  let { stateManager, testState } = await getState(
    defaultStateName,
    defaultWriterName,
  );

  testState.numberField = 10;
  testState.stringField = "abc";
  let states = stateManager.getStates();

  assertEquals(states, {
    [defaultStateName]: {
      numberField: 10,
      stringField: "abc",
    },
  });
});

Deno.test("get-states-with-2-states-should-return-2", async () => {
  let { stateManager, testState } = await getState(
    defaultStateName,
    defaultWriterName,
  );

  testState.numberField = 10;
  testState.stringField = "abc";
  let defaultStateName2 = defaultStateName + "2";
  let testState2 = stateManager.getState(
    defaultStateName2,
    defaultWriterName,
  );

  testState2.numberField = 30;

  let states = stateManager.getStates();
  assertEquals(states, {
    [defaultStateName]: {
      numberField: 10,
      stringField: "abc",
    },
    [defaultStateName2]: {
      numberField: 30,
    },
  });
});

Deno.test("replace-should-replace-and-run-subscriptions", async () => {
   const { stateManager, testState, stateChangeData } = await getState(
    defaultStateName,
    defaultWriterName,
  );
  const initialStringValue = "Some String value";
  const testStringValue = "Another string value";
  testState.stringValue = initialStringValue;
  
  const states = { 
    [defaultStateName]: {
      stringValue: testStringValue
    }
  };

  stateManager.replace(states);

  assertEquals(stateChangeData.prevValue, { stringValue: initialStringValue });
  assertEquals(stateChangeData.nextValue, { stringValue: testStringValue });
  assertEquals(stateChangeData.writerName, "replace");
});

//Deno.test("replace-with-invalid-object-should-fail");
//Deno.test("replace-with-nonexisting-state-name-should-fail");
//Deno.test("replaceone-with-nonstring-name-should-fail");
//Deno.test("replaceone-should-replace-state");
