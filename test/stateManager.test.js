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
      }, /Invalid parameter:*/);
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

  describe("when deleting state", function () {
    it("should remove it's data and all subscriptions", function () {
      let testState = stateManager.getState(
        defaultStateName,
        defaultWriterName
      );

      let subscriptionCallCount = 0;

      stateManager.subscribe(defaultStateName, () => subscriptionCallCount++);

      testState.numberField = 10;

      stateManager.deleteState(defaultStateName);

      testState = stateManager.getState(defaultStateName, defaultWriterName);

      assert.equal(testState.numberField, undefined);

      testState.anotherNumberField = 20;

      assert.equal(subscriptionCallCount, 1);
    });
  });

  describe("when getStates() is called", function () {
    let testState1;

    beforeEach(function () {
      testState1 = stateManager.getState(defaultStateName, defaultWriterName);

      testState1.numberField = 10;
      testState1.stringField = "abc";
    });

    describe("with only 1 state", function () {
      it("should return object with 1 state", function () {
        let states = stateManager.getStates();

        assert.deepEqual(states, {
          [defaultStateName]: {
            numberField: 10,
            stringField: "abc",
          },
        });
      });
    });

    describe("with 2 states", function () {
      it("should return object with 2 states", function () {
        let defaultStateName2 = defaultStateName + "2";
        let testState2 = stateManager.getState(
          defaultStateName2,
          defaultWriterName
        );

        testState2.numberField = 30;

        let states = stateManager.getStates();

        assert.deepEqual(states, {
          [defaultStateName]: {
            numberField: 10,
            stringField: "abc",
          },
          [defaultStateName2]: {
            numberField: 30,
          },
        });
      });
    });
  });

  describe("when replace() is called", function () {
    it("should replace all states and run existing subscriptions", function () {
      let testState = stateManager.getState(
        defaultStateName,
        defaultWriterName
      );

      let subscriptionCallCount = 0;

      stateManager.subscribe(defaultStateName, () => subscriptionCallCount++);

      testState.numberField = 10;
      testState.stringField = "abc";

      let states = stateManager.getStates();

      testState.anotherField = 30;

      stateManager.replace(states);

      assert.equal(subscriptionCallCount, 4);
    });
  });

  describe("when replace() is called with invalid states object", function () {
    it("should throw an error", function () {
      assert.throws(() => {
        stateManager.replace(undefined);
      }, /Invalid parameter:*/);
    });
  });

  describe("when replace() is called with non existing state names", function () {
    it("should throw an error that non existing stateName is provided", function () {
      assert.throws(() => {
        let testState = stateManager.getState(
          defaultStateName,
          defaultWriterName
        );

        testState.numberField = 1;

        stateManager.replace({
          NonExistingStateName: { numberField: 10 },
        });
      }, /State not found for name:*/);
    });
  });

  describe("when replaceOne() is called with non string state name", function () {
    it("should throw an error", function () {
      assert.throws(() => {
        stateManager.replaceOne(10, { field1: 10 });
      }, /Invalid parameter: stateName*/);
    });
  });

  describe("when replaceOn() is called", function () {
    it("should replace state value and call subscription only once", function () {
      let subscriptionCallCount = 0;

      stateManager.subscribe(defaultStateName, () => subscriptionCallCount++);

      stateManager.replaceOne(defaultStateName, {
        field1: 20,
        field2: "abc",
      });

      let testState = stateManager.getState(defaultStateName);

      assert.equal(subscriptionCallCount, 1);

      assert.deepEqual(testState, {
        field1: 20,
        field2: "abc",
      });
    });
  });
});
