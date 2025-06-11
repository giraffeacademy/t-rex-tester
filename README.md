# 🦖 T-Rex Tester

T-Rex Tester is a minimalist JavaScript testing library built for the browser. It lets you write expressive test cases and organize them into suites, with clean, colorful console output.

Features include:

- ✅ Simple `it()` and `assert()` syntax
- 🧪 Nested test suites with `useTests()`
- 🔁 Lifecycle hooks like `beforeEach`, `afterEach`
- 🔍 Powerful test filtering with name prefixes
- 🐾 Console log capturing for each test
- 🧭 Zero-config and fun to use

---

## 📦 Installation

Install via npm:

```bash
npm install t-rex-tester
```

Then everything you need is available on the window and in the global namespace (browser environment, like Vite or Parcel):

```
it
useTests
assert
before
after
beforeEach
afterEach
sleep
useSpy
```

Since T-Rex Tester is primarily used in `.test.js` files, globals are used freely (this is sometimes bad practice in development code).

## 🚀 Basic Usage

Here's a simple example using T-Rex Tester to test a function called `add`:

```js
import "t-rex-tester";

// The function we're testing
function add(a, b) {
  return a + b;
}

useTests("🧮 Add Function", () => {
  beforeEach(() => {
    console.log("Running a test for 'add'");
  });

  afterEach(() => {
    console.log("Test completed");
  });

  it("adds two positive numbers", () => {
    assert(add(2, 3) === 5, "2 + 3 should equal 5");
  });

  it("adds positive and negative number", () => {
    assert(add(10, -4) === 6, "10 + (-4) should equal 6");
  });

  it("adds zero", () => {
    assert(add(0, 5) === 5, "0 + 5 should equal 5");
  });
});
```

Tests are nested inside `useTests` and `assert` can be used to check a condition. A helpful output message gives the test more context and will be displayed inside the browser's console automatically (this is optional).

## Async Tests

T-Rex Tester provides full support for `async/await` and even provides a useful `sleep(ms)` function which can be used either in your code directly or in the tests to wait a specified number of milliseconds.

Here’s a basic example:

```js
import "t-rex-tester";

// Example async function to test
async function delayedAdd(a, b, delay = 100) {
  await sleep(delay);
  return a + b;
}

useTests("🕒 Async Function Tests", () => {
  it("adds numbers after a delay", async () => {
    const result = await delayedAdd(3, 4, 200);
    assert(result === 7, "3 + 4 after delay should equal 7");
  });

  it("handles zero delay", async () => {
    const result = await delayedAdd(10, 5, 0);
    assert(result === 15, "10 + 5 with zero delay should equal 15");
  });
});
```

In the example above `sleep(ms)` is used in the `delayedAdd` function, but it could easily be used in a test if you want to wait for something that takes a while like a network request or reading from a file.

In the example below we wait 200 milliseconds:

```js
useTests("🛌 Sleep Timing Tests", () => {
  it("waits before running assertion", async () => {
    const start = performance.now();

    await sleep(200); // Simulate delay

    const elapsed = performance.now() - start;
    assert(
      elapsed >= 200,
      `Slept at least 200ms (got ${Math.round(elapsed)}ms)`
    );
  });
});
```

## 🔍 Test Filtering with Prefixes

T-Rex Tester supports filtering which tests run using name-based prefixes. This helps you focus on specific tests without commenting others out.

| Prefix  | Meaning                               |
| ------- | ------------------------------------- |
| `" "`   | 1 space - run ONLY this test or suite |
| `"  "`  | 2 spaces - run SOLO – just this one   |
| `"   "` | 3 spaces - skip this test or suite    |

### 🧪 Example

```js
import { it, useTests, assert } from "t-rex-tester";

useTests("🎯 Filtered Tests", () => {
  it("   skipped test", () => {
    assert(false, "This should be skipped and not run");
  });

  it(" only this one runs", () => {
    assert(true, "This test runs because it has a leading space");
  });

  it("  solo test (highest priority)", () => {
    assert(true, "This test runs and everything else is ignored");
  });

  it("normal test", () => {
    assert(false, "This test will not run due to solo mode");
  });
});
```

With these pre-fixes it's easy to filter which tests are running on the fly by simply changing the beginning of the name. These changes can also then be committed into version control for lasting effect.

## 🕵️ Function Spying with `useSpy`

T-Rex Tester includes a `useSpy()` utility that lets you observe calls to a function — useful for verifying side effects or logging.

### 🔧 Syntax

```js
const undo = useSpy(targetObject, methodName, (returnValue, ...args) => {
  // runs whenever the method is called
});
```

In the example below we'll spy on a `mathUtils` function and push the arguments into a `calls` array:

```js
import "t-rex-tester";

// Function under test
const mathUtils = {
  double(n) {
    return n * 2;
  },
};

useTests("🕵️ useSpy Example", () => {
  it("spies on a function and captures calls", () => {
    const calls = [];

    const undo = useSpy(mathUtils, "double", (returnValue, arg) => {
      calls.push({ arg, returnValue });
    });

    const a = mathUtils.double(4); // should be 8
    const b = mathUtils.double(7); // should be 14

    undo(); // restore original function

    assert(a === 8, "double(4) should return 8");
    assert(b === 14, "double(7) should return 14");
    assert(calls.length === 2, "Function was called twice");
    assert(
      calls[0].arg === 4 && calls[0].returnValue === 8,
      "First call correct"
    );
    assert(
      calls[1].arg === 7 && calls[1].returnValue === 14,
      "Second call correct"
    );
  });
});
```

## Full API Documentation

### `useTests(name, fn)`

Creates a test suite that can contain multiple tests and nested test suites.

**Signature:**

```typescript
useTests(name: string, fn: () => void | Promise<void>): () => void
```

**Parameters:**

- `name` (`string`) - The name of the test suite. Can include filtering prefixes (` `, `  `, `   `)
- `fn` (`function`) - Function containing the test suite's tests and setup code

**Returns:**

- `function` - The same function passed as `fn` parameter

**Behavior:**

- Creates a new `TestSuite` instance
- Sets the current test suite context for nested tests
- Supports async functions
- Inherits setup/teardown hooks from parent suites
- Can be nested within other test suites

**Examples:**

```javascript
// Basic test suite
useTests("Math Operations", () => {
  it("should add numbers", () => {
    assert(2 + 2 === 4);
  });
});

// Nested test suites
useTests("User Management", () => {
  useTests("Authentication", () => {
    it("should validate credentials", () => {
      // test implementation
    });
  });

  useTests("Authorization", () => {
    it("should check permissions", () => {
      // test implementation
    });
  });
});

// Async test suite
useTests("Database Operations", async () => {
  await setupDatabase();

  it("should save user", async () => {
    const user = await saveUser({ name: "John" });
    assert(user.id > 0);
  });
});
```

---

### `it(name, fn)`

Creates an individual test case.

**Signature:**

```typescript
it(name: string, fn: () => void | Promise<void>): () => void
```

**Parameters:**

- `name` (`string`) - The name of the test. Can include filtering prefixes (` `, `  `, `   `)
- `fn` (`function`) - Function containing the test implementation

**Returns:**

- `function` - The same function passed as `fn` parameter

**Behavior:**

- Creates a new `Test` instance
- Captures console.log calls during execution
- Tracks execution time
- Handles both sync and async functions
- Catches and reports errors automatically

**Examples:**

```javascript
// Synchronous test
it("should calculate sum", () => {
  const result = add(2, 3);
  assert(result === 5, "2 + 3 should equal 5");
});

// Asynchronous test
it("should fetch user data", async () => {
  const user = await fetchUser(123);
  assert(user.name === "John Doe");
});

// Test with console logging
it("should log debug info", () => {
  console.log("Starting calculation");
  const result = multiply(4, 5);
  console.log(`Result: ${result}`);
  assert(result === 20);
});

// File-based test
it("/tests/integration.js", () => {
  // File will be dynamically imported
});
```

---

### `assert(condition, message?)`

Creates a test assertion that determines if a test passes or fails.

**Signature:**

```typescript
assert(condition: boolean, message?: string): void
```

**Parameters:**

- `condition` (`boolean`) - The condition to evaluate
- `message` (`string`, optional) - Custom message to display when assertion fails

**Returns:**

- `void`

**Behavior:**

- Creates a `TestResult` and adds it to the current test
- Logs the result immediately with appropriate styling
- If condition is false, marks the test as failed
- Must be called within a test context (`it` function)

**Examples:**

```javascript
// Basic assertions
assert(true, "This will pass");
assert(2 + 2 === 4, "Math should work");
assert(user.isActive, "User should be active");

// Without custom message
assert(array.length > 0); // Uses default "passed"/"failed" message

// Complex conditions
assert(
  result.success && result.data.length > 0,
  "Should return successful result with data"
);

// Assertion with variable message
const expectedCount = 5;
const actualCount = items.length;
assert(
  actualCount === expectedCount,
  `Expected ${expectedCount} items, got ${actualCount}`
);
```

---

## Setup and Teardown Hooks

### `before(...fns)`

Registers functions to run once before all tests in the current test suite.

**Signature:**

```typescript
before(...fns: (() => void | Promise<void>)[]): void
```

**Parameters:**

- `...fns` (`function[]`) - One or more functions to execute before the test suite

**Returns:**

- `void`

**Behavior:**

- Functions run once before any test in the suite executes
- Inherited by nested test suites
- Supports async functions
- Executes in the order they were registered

**Examples:**

```javascript
useTests("Database Tests", () => {
  before(() => {
    console.log("Connecting to database");
    database.connect();
  });

  before(async () => {
    await database.migrate();
    await database.seed();
  });

  it("should query users", () => {
    const users = database.query("SELECT * FROM users");
    assert(users.length > 0);
  });
});

// Multiple before hooks
useTests("API Tests", () => {
  before(
    () => startMockServer(),
    () => authenticateTestUser(),
    async () => await loadTestData()
  );

  it("should make API call", () => {
    // All before hooks have run
  });
});
```

---

### `after(...fns)`

Registers functions to run once after all tests in the current test suite.

**Signature:**

```typescript
after(...fns: (() => void | Promise<void>)[]): void
```

**Parameters:**

- `...fns` (`function[]`) - One or more functions to execute after the test suite

**Returns:**

- `void`

**Behavior:**

- Functions run once after all tests in the suite complete
- Inherited by nested test suites
- Supports async functions
- Executes even if tests fail
- Executes in the order they were registered

**Examples:**

```javascript
useTests("File System Tests", () => {
  after(() => {
    console.log("Cleaning up test files");
    fs.removeSync("./test-temp");
  });

  after(async () => {
    await database.close();
  });

  it("should create file", () => {
    fs.writeFileSync("./test-temp/file.txt", "content");
    assert(fs.existsSync("./test-temp/file.txt"));
  });
});
```

---

### `beforeEach(...fns)`

Registers functions to run before each individual test in the current test suite.

**Signature:**

```typescript
beforeEach(...fns: (() => void | Promise<void>)[]): void
```

**Parameters:**

- `...fns` (`function[]`) - One or more functions to execute before each test

**Returns:**

- `void`

**Behavior:**

- Functions run before every single test in the suite
- Inherited by nested test suites
- Supports async functions
- Executes in the order they were registered

**Examples:**

```javascript
useTests("Shopping Cart Tests", () => {
  let cart;

  beforeEach(() => {
    cart = new ShoppingCart();
    console.log("Created fresh cart");
  });

  beforeEach(() => {
    cart.addItem({ id: 1, name: "Default Item", price: 10 });
  });

  it("should have default item", () => {
    assert(cart.items.length === 1);
  });

  it("should calculate total", () => {
    assert(cart.total === 10);
  });
});
```

---

### `afterEach(...fns)`

Registers functions to run after each individual test in the current test suite.

**Signature:**

```typescript
afterEach(...fns: (() => void | Promise<void>)[]): void
```

**Parameters:**

- `...fns` (`function[]`) - One or more functions to execute after each test

**Returns:**

- `void`

**Behavior:**

- Functions run after every single test in the suite
- Inherited by nested test suites
- Supports async functions
- Executes even if the test fails
- Executes in the order they were registered

**Examples:**

```javascript
useTests("DOM Manipulation Tests", () => {
  afterEach(() => {
    // Clean up DOM after each test
    document.body.innerHTML = "";
    console.log("Cleaned up DOM");
  });

  afterEach(() => {
    // Reset global state
    window.testData = undefined;
  });

  it("should create element", () => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    assert(document.body.children.length === 1);
  });

  it("should start with clean DOM", () => {
    // DOM is clean thanks to afterEach
    assert(document.body.children.length === 0);
  });
});
```

---

## Utility Functions

### `useId()`

Generates a unique incrementing identifier.

**Signature:**

```typescript
useId(): number
```

**Parameters:**

- None

**Returns:**

- `number` - A unique incremental identifier

**Behavior:**

- Returns incrementing integers starting from 0
- Thread-safe within a single execution context
- Useful for generating unique element IDs, keys, etc.

**Examples:**

```javascript
// Generate unique IDs
const id1 = useId(); // 0
const id2 = useId(); // 1
const id3 = useId(); // 2

// Use in tests
it("should create unique elements", () => {
  const elementId = `test-element-${useId()}`;
  const element = document.createElement("div");
  element.id = elementId;

  assert(element.id.startsWith("test-element-"));
});

// Generate test data
it("should handle multiple users", () => {
  const users = Array.from({ length: 3 }, () => ({
    id: useId(),
    name: `User ${useId()}`,
  }));

  assert(users.length === 3);
  assert(users.every((user) => typeof user.id === "number"));
});
```

---

### `sleep(duration)`

Creates a promise that resolves after the specified duration.

**Signature:**

```typescript
sleep(duration: number): Promise<void>
```

**Parameters:**

- `duration` (`number`) - Time to wait in milliseconds

**Returns:**

- `Promise<void>` - Promise that resolves after the duration

**Behavior:**

- Non-blocking delay using setTimeout
- Useful for testing async operations and timing
- Can be used with async/await

**Examples:**

```javascript
// Basic delay
it("should wait for operation", async () => {
  startAsyncOperation();
  await sleep(100); // Wait 100ms
  assert(operationCompleted, "Operation should complete");
});

// Testing timing
it("should respect rate limits", async () => {
  const start = Date.now();

  await apiCall();
  await sleep(50); // Simulate rate limit
  await apiCall();

  const elapsed = Date.now() - start;
  assert(elapsed >= 50, "Should wait at least 50ms between calls");
});

// Sequential operations with delays
it("should process items sequentially", async () => {
  const results = [];

  for (let i = 0; i < 3; i++) {
    results.push(await processItem(i));
    await sleep(25); // Delay between items
  }

  assert(results.length === 3);
});
```

---

### `useSpy(target, fnKey, callback)`

Creates a spy for a function, allowing you to intercept calls and monitor behavior.

**Signature:**

```typescript
useSpy<T, K extends keyof T>(
  target: T,
  fnKey: K,
  callback: (result: ReturnType<T[K]>, ...args: Parameters<T[K]>) => void
): () => void
```

**Parameters:**

- `target` (`object`) - The object containing the function to spy on
- `fnKey` (`string`) - The name/key of the function to spy on
- `callback` (`function`) - Function called with the return value and original arguments

**Returns:**

- `function` - Function to restore the original behavior

**Behavior:**

- Wraps the original function to intercept calls
- Calls the original function and passes result to callback
- Preserves original function behavior
- Returns a restore function to undo the spy

**Examples:**

```javascript
// Basic spying
it("should spy on method calls", () => {
  const obj = { getValue: () => 42 };
  let spyCalled = false;
  let spyResult;

  const restore = useSpy(obj, "getValue", (result) => {
    spyCalled = true;
    spyResult = result;
  });

  const value = obj.getValue();

  assert(spyCalled, "Spy should be called");
  assert(spyResult === 42, "Spy should capture result");
  assert(value === 42, "Original behavior preserved");

  restore(); // Restore original function
});

// Spy on function with arguments
it("should track function arguments", () => {
  const calculator = {
    add: (a, b) => a + b,
  };

  const calls = [];
  const restore = useSpy(calculator, "add", (result, a, b) => {
    calls.push({ args: [a, b], result });
  });

  calculator.add(2, 3);
  calculator.add(5, 7);

  assert(calls.length === 2, "Should track both calls");
  assert(calls[0].args[0] === 2 && calls[0].args[1] === 3);
  assert(calls[0].result === 5);
  assert(calls[1].result === 12);

  restore();
});

// Spy on async functions
it("should spy on async functions", async () => {
  const api = {
    fetchData: async (id) => ({ id, data: "test" }),
  };

  let asyncSpyCalled = false;
  const restore = useSpy(api, "fetchData", (result, id) => {
    asyncSpyCalled = true;
    console.log(`fetchData(${id}) returned:`, result);
  });

  const result = await api.fetchData(123);

  assert(asyncSpyCalled, "Async spy should be called");
  assert(result.id === 123, "Should return correct result");

  restore();
});

// Multiple spies
it("should handle multiple spies", () => {
  const service = {
    get: () => "data",
    set: (value) => `saved: ${value}`,
  };

  let getCalled = false,
    setCalled = false;

  const restoreGet = useSpy(service, "get", () => {
    getCalled = true;
  });
  const restoreSet = useSpy(service, "set", () => {
    setCalled = true;
  });

  service.get();
  service.set("test");

  assert(getCalled && setCalled, "Both spies should be called");

  restoreGet();
  restoreSet();
});
```

## Error Handling

### Automatic Error Catching

T-Rex Tester automatically catches and handles various types of errors:

**Synchronous Errors:**

```javascript
it("should catch sync errors", () => {
  throw new Error("This will be caught");
  // Test will fail but won't crash the runner
});
```

**Asynchronous Errors:**

```javascript
it("should catch async errors", async () => {
  throw new Error("Async error caught");
  // Async errors are also handled
});
```

**Setup/Teardown Errors:**

```javascript
useTests("Error Handling", () => {
  before(() => {
    throw new Error("Setup error");
    // Won't prevent other tests from running
  });

  it("should still run", () => {
    assert(true);
  });
});
```

### Error Information

When errors occur, T-Rex Tester provides:

- Full stack traces
- Error messages with styling
- Context about which test/suite failed
- Continued execution of remaining tests

---

## Test Filtering Reference

### Prefix Syntax

| Prefix            | Name | Behavior                                     |
| ----------------- | ---- | -------------------------------------------- |
| ` ` (1 space)     | Only | Run only tests/suites with this prefix       |
| `  ` (2 spaces)   | Solo | Run only this single test, ignore all others |
| `   ` (3+ spaces) | Skip | Skip this test/suite entirely                |

### Filtering Priority

1. **Solo** (highest priority) - If any solo test exists, only it runs
2. **Skip** - Tests/suites are excluded from execution
3. **Only** - If any "only" tests exist, only they run
4. **Normal** - Runs if no filters are active

### Name Processing

- Spaces are trimmed from display names
- File paths (starting with `/`) show only the filename in displays
- Filtering prefixes are detected before trimming
