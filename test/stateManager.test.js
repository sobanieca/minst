import assert from "assert";

describe("given testState", async function () {
  const defaultStateName = "test";
  const defaultWriterName = "testWriter";
  let prevValue, nextValue, writerName, stateManager;

  let verifyStateChange = (p, n, w) => {
    prevValue = p;
    nextValue = n;
    writerName = w;
  };

  let importCounter = 0;
  beforeEach(async function () {
    prevValue = nextValue = writerName = undefined;
    let stateManagerModule = await import(
      `../lib/stateManager.js?${importCounter++}`
    );
    stateManager = stateManagerModule.default;
  });

  describe("when changing number value", function () {
    it("should trigger subscription", function () {
      let testState = stateManager.getState(
        defaultStateName,
        defaultWriterName
      );
      stateManager.subscribe(defaultStateName, verifyStateChange);

      testState.numberField = 10;

      assert.equal(testState.numberField, 10);
      assert.deepEqual(prevValue, {});
      assert.deepEqual(nextValue, { numberField: 10 });
      assert.equal(writerName, defaultWriterName);
    });
  });

  describe("when changing string value", function () {
    it("should trigger subscription", function () {
      let testState = stateManager.getState(
        defaultStateName,
        defaultWriterName
      );
      stateManager.subscribe(defaultStateName, verifyStateChange);

      testState.stringField = "SomeString1";

      assert.equal(testState.stringField, "SomeString1");
      assert.deepEqual(prevValue, {});
      assert.deepEqual(nextValue, { stringField: "SomeString1" });
      assert.equal(writerName, defaultWriterName);
    });
  });

  describe("when changing array value", function () {
    it("should trigger subscription", function () {
      let testState = stateManager.getState(
        defaultStateName,
        defaultWriterName
      );
      stateManager.subscribe(defaultStateName, verifyStateChange);

      testState.arrayField = ["Item1"];

      assert.deepEqual(testState, { arrayField: ["Item1"] });
      assert.deepEqual(prevValue, {});
      assert.deepEqual(nextValue, { arrayField: ["Item1"] });
      assert.equal(writerName, defaultWriterName);
    });
  });

  describe("when changing nested object", function () {
    it("should trigger subscription", function () {
      let testState = stateManager.getState(
        defaultStateName,
        defaultWriterName
      );
      stateManager.subscribe(defaultStateName, verifyStateChange);

      testState.nestedObject = {};
      testState.nestedObject.anotherNestedObject = { someField: 14 };

      let targetValue = {
        nestedObject: {
          anotherNestedObject: {
            someField: 14,
          },
        },
      };

      assert.deepEqual(testState, targetValue);
      assert.deepEqual(prevValue, { nestedObject: {} });
      assert.deepEqual(nextValue, targetValue);
      assert.equal(writerName, defaultWriterName);
    });
  });

  describe("when changing property but no writerName is provided", function () {
    it("should throw an error", function () {
      let testState = stateManager.getState(defaultStateName);

      assert.throws(() => {
        testState.numberField = 10;
      }, /Operation not allowed.*/);
    });
  });

  describe("when multiple subscriptions added", function () {
    it("should run all of them on change", function () {
      let testState = stateManager.getState(
        defaultStateName,
        defaultWriterName
      );

      let subscriptionCallCount = 0;
      let expectedSubscriptionsCallCount = 5;

      for (let i = 0; i < expectedSubscriptionsCallCount; i++) {
        stateManager.subscribe(defaultStateName, () => subscriptionCallCount++);
      }

      testState.numberField = 10;

      assert.equal(subscriptionCallCount, expectedSubscriptionsCallCount);
    });
  });

  describe("when providing non string stateName", function () {
    it("should throw an error", function () {
      assert.throws(() => {
        stateManager.getState({});
      }, /Invalid argument.*/);
    });
  });

  describe("when providing non-function to subscribe", function () {
    it("should throw an error", function () {
      assert.throws(() => {
        stateManager.subscribe(defaultStateName, 10);
      }, /Subscribe failed.*/);
    });
  });

  describe("when unsubscribing", function () {
    it("should not call subscription", function () {
      let testState = stateManager.getState(
        defaultStateName,
        defaultWriterName
      );

      let subscriptionCallCount = 0;

      let subscriptionId = stateManager.subscribe(
        defaultStateName,
        () => subscriptionCallCount++
      );

      testState.numberField = 10;

      assert.equal(subscriptionCallCount, 1);

      stateManager.unsubscribe(defaultStateName, subscriptionId);

      testState.numberField = 11;

      assert.equal(subscriptionCallCount, 1);
    });
  });
});
