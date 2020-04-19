function deepFreeze(obj) {
  let propertyNames = Object.getOwnPropertyNames(obj);

  propertyNames.forEach(function (name) {
    let property = obj[name];

    if (typeof property == "object" && property !== null) deepFreeze(property);
  });

  return Object.freeze(obj);
}

function deepClone(obj) {
  if (typeof obj !== "object" || obj == null) return obj;

  let result = {};
  let propertyNames = Object.getOwnPropertyNames(obj);

  for (let property of propertyNames) {
    if (Array.isArray(obj[property])) {
      let arr = obj[property];
      let arrCopy = new Array(arr.length);
      for (let index in arr) {
        arrCopy[index] = deepClone(arr[index]);
      }
      result[property] = arrCopy;
      continue;
    }
    if (typeof obj[property] === "object") {
      result[property] = deepClone(obj[property]);
      continue;
    }
    result[property] = obj[property];
  }

  return result;
}

function triggerSubscriptions(
  previousState,
  newState,
  writerName,
  subscriptions
) {
  for (let subscriptionId of Object.keys(subscriptions)) {
    subscriptions[subscriptionId](previousState, newState, writerName);
  }
}

function getHandler(state, writerName, subscriptions) {
  return {
    get(target, property, receiver) {
      try {
        return new Proxy(
          target[property],
          getHandler(state, writerName, subscriptions)
        );
      } catch (err) {
        return Reflect.get(target, property, receiver);
      }
    },
    set(target, property) {
      if (Array.isArray(target) && property === "length")
        return Reflect.set(...arguments);
      if (!writerName) {
        throw new Error(
          "Operation not allowed. Use " +
            "stateManager.getState('stateName', 'writerName') method " +
            "with proper 'writerName' to open state in 'Write' mode."
        );
      }

      let previousState = deepFreeze(deepClone(state));
      Reflect.set(...arguments);
      let newState = deepFreeze(deepClone(state));
      triggerSubscriptions(previousState, newState, writerName, subscriptions);
      return true;
    },
    setPrototypeOf() {
      throw new Error(
        "Operation setPrototypeOf not permitted on state object!"
      );
    },
    preventExtensions() {
      throw new Error(
        "Operation preventExtensions not permitted on state object!"
      );
    },
    deleteProperty(target, property) {
      let previousState = deepFreeze(deepClone(state));
      if (property in target) {
        delete target[property];
      }
      let newState = deepFreeze(deepClone(state));
      triggerSubscriptions(previousState, newState, writerName, subscriptions);
    },
    construct() {
      throw new Error("Operation construct not permitted on state object!");
    },
  };
}

function createProxy(target, writerName, subscriptions) {
  return new Proxy(target, getHandler(target, writerName, subscriptions));
}

let statesWithSubscriptions = {};

function getStateWithSubscription(stateName, createIfNotExists = true) {
  if (typeof stateName !== "string")
    throw new Error("Invalid parameter: stateName needs to be string value");

  if (statesWithSubscriptions[stateName] == null && createIfNotExists) {
    statesWithSubscriptions[stateName] = {
      state: {},
      subscriptions: {},
    };
  }

  return statesWithSubscriptions[stateName];
}

function getSubscriptionId() {
  return `${new Date().getTime()}${Math.round(Math.random() * 10e12)}`;
}

class StateManager {
  /**
   * Return all state names available in stateManager
   *
   * @returns {string[]} array of state names
   */
  getStateNames() {
    return Object.keys(statesWithSubscriptions);
  }

  /**
   * Get state which is supposed to be used. If no matching state name is found
   * it will create a new state. One can assign any values to it, each
   * change will trigger subscription (callback function that takes as an
   * input previous value, new value and writer name paramters).
   *
   * @param {string} stateName state to get (create if not exists)
   * @param {string} writerName writer name - for opening state in 'read/write' mode
   *
   * @returns {object} state object
   */
  getState(stateName, writerName) {
    let stateWithSubscriptions = getStateWithSubscription(stateName);
    return createProxy(
      stateWithSubscriptions.state,
      writerName,
      stateWithSubscriptions.subscriptions
    );
  }

  /**
   * Returns all states without subscriptions. Can be later used in
   * replace() method
   *
   * @returns {object} states object
   */
  getStates() {
    let result = {};
    for (let stateName in statesWithSubscriptions) {
      result[stateName] = statesWithSubscriptions[stateName].state;
    }
    return result;
  }

  /**
   * Replace all states values with statesObject, triggering all subscriptions
   * Can be used when working with History API pushState() method
   *
   * @param {object} states object
   */
  replace(states) {
    if (!states) {
      throw new Error(
        "Invalid parameter: states needs to match getStates() result structure"
      );
    }
    for (let stateName in states) {
      if (!statesWithSubscriptions[stateName])
        throw new Error(`State not found for name: ${stateName}`);

      let stateWithSubscriptions = statesWithSubscriptions[stateName];
      let previousState = deepFreeze(deepClone(stateWithSubscriptions.state));
      statesWithSubscriptions[stateName].state = states[stateName];
      let newState = deepFreeze(deepClone(states[stateName]));
      triggerSubscriptions(
        previousState,
        newState,
        "replace",
        stateWithSubscriptions.subscriptions
      );
    }
  }

  /**
   * Replaces entire state (with given stateName) with given value
   *
   * @param {string} stateName stateName to be replaced
   * @param {object} value new value of given state
   */
  replaceOne(stateName, value) {
    let stateWithSubscriptions = getStateWithSubscription(stateName);
    let previousState = deepFreeze(deepClone(stateWithSubscriptions.state));
    stateWithSubscriptions.state = value;
    let newState = deepFreeze(deepClone(value));
    triggerSubscriptions(
      previousState,
      newState,
      "replaceOne",
      stateWithSubscriptions.subscriptions
    );
  }

  /**
   * Delete state - cleanup all subscriptions and data
   *
   * @param {string} stateName state to delete
   */
  deleteState(stateName) {
    delete statesWithSubscriptions[stateName];
  }

  /**
   * Subscribe to state changes. Each change of given state will trigger
   * all subscriptions.
   *
   * @param {string} stateName state name
   * @param {Function} subscription (previousValue, newValue, writerName) => {}
   *
   * @returns {string} subscriptionId that can be used to unsubscribe
   */
  subscribe(stateName, subscription) {
    let stateWithSubscriptions = getStateWithSubscription(stateName);
    let subscriptionId = getSubscriptionId();

    if (typeof subscription !== "function") {
      throw new Error("Subscribe failed. Non function provided.");
    }

    stateWithSubscriptions.subscriptions[subscriptionId] = subscription;
    return subscriptionId;
  }

  /**
   * Removes given subscription from given state
   *
   * @param {string} stateName state name
   * @param {string} subscriptionId subscriptionId of subscription to
   * remove (obtained during subscribe() method)
   */
  unsubscribe(stateName, subscriptionId) {
    let stateWithSubscriptions = getStateWithSubscription(stateName, false);

    if (!stateWithSubscriptions)
      throw new Error(
        "Unsubscribe failed. State with name: ${stateName} not found."
      );

    delete stateWithSubscriptions.subscriptions[subscriptionId];
  }
}

let stateManager = new StateManager();

export default stateManager;
