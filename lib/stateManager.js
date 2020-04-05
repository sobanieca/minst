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
    throw new Error(
      "Invalid argument. Parameter stateName needs to be string value"
    );

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
  getStateNames() {
    return Object.keys(statesWithSubscriptions);
  }

  getState(stateName, writerName) {
    let stateWithSubscriptions = getStateWithSubscription(stateName);
    return createProxy(
      stateWithSubscriptions.state,
      writerName,
      stateWithSubscriptions.subscriptions
    );
  }

  subscribe(stateName, subscription) {
    let stateWithSubscriptions = getStateWithSubscription(stateName);
    let subscriptionId = getSubscriptionId();

    if (typeof subscription !== "function") {
      throw new Error("Subscribe failed. Non function provided.");
    }

    stateWithSubscriptions.subscriptions[subscriptionId] = subscription;
    return subscriptionId;
  }

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
