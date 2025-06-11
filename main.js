if (!window) window = {};
{
  window.GLOBAL_STYLE = document.createElement("style");
  window.GLOBAL_STYLE.id = "GLOBAL_STYLE";
  document.head.append(GLOBAL_STYLE);
  GLOBAL_STYLE.textContent += `
* {
  box-sizing: border-box;
  position: relative;
}

body div {
  display: flex;
  flex-direction: column;
}
`;
}

let id = 0;
window.useId = () => id++;

class Test {
  static current = null;
  static styleFail = "color: #F7768E;";
  static stylePass = `color: #9ECE6A;`;

  constructor(name = "", fn = () => {}) {
    this._only = name[0] === " " && name[1] !== " ";
    this.solo = name.startsWith("  ") && name[2] !== " ";
    this.skip = name.startsWith("   ");

    this.passed = false;
    this.name = name.trim();
    this.time = 0;

    this.fn = fn;
    this.results = [];
    this.initialized = false;
    this.log = [];
    if (TestSuite.current) TestSuite.current._children.push(this);
  }

  get isFileName() {
    return this.name.startsWith("/");
  }
  get displayName() {
    return this.isFileName
      ? this.name.split("/").pop() || this.name
      : this.name;
  }

  get only() {
    return this._only;
  }
  set only(_) {}

  get failed() {
    return !this.passed;
  }
  get passingResults() {
    return this.results.filter((r) => r.passed);
  }
  get failingResults() {
    return this.results.filter((r) => !r.passed);
  }

  async Run() {
    this.results = [];
    const _consoleLog = console.log;
    const startTime = performance.now();
    try {
      Test.current = this;

      window.frag = document.createDocumentFragment();
      ["div", "span", "input"].forEach((type) => {
        const e = document.createElement(type);
        GLOBAL_STYLE.textContent = ``;
        window[type] = e;
        e.style.visibility = "hidden";
        e.style.position = "absolute";
        document.body.append(e);
      });

      console.log = (...args) => this.log.push([...args]);

      TestSuite.current.beforeEach.forEach((fn) => fn());
      await this.fn();
    } catch (e) {
      console.log(`%cERROR: ${e.stack || e.message || e}`, Test.styleFail);
      this.results.push(new TestResult(false, e));
    } finally {
      TestSuite.current.afterEach.forEach((fn) => fn());

      this.time = performance.now() - startTime;
      div.remove();
      span.remove();
      input.remove();
      div = null;
      span = null;
      input = null;

      console.log = _consoleLog;
    }

    this.passed = !this.results.some((r) => !r.passed);
    return new TestResult(this.passed, this.name);
  }

  async Init() {
    this.initialized = true;
  }

  Log({ open = false } = {}) {
    const logArgs = [
      `%c${this.displayName} ${
        this.time > 1 ? `(${Math.trunc(this.time)}ms)` : ``
      }`,
      (this.passed ? Test.stylePass : Test.styleFail) + ``,
    ];

    if (!open && this.passed && !this.only) console.groupCollapsed(...logArgs);
    else console.group(...logArgs);

    this.log.forEach(([...args]) => console.log(...args));
    console.groupEnd();
  }
}
class TestSuite extends Test {
  static current = null;

  constructor(...args) {
    super(...args);

    this._children = [];

    this.before = [];
    this.after = [];
    this.beforeEach = [];
    this.afterEach = [];
  }

  get children() {
    return this._children.filter((c) => !c.skip);
  }

  get only() {
    return this._only || this.children.some((c) => c.only);
  }
  set only(_) {}

  get childrenTestSuite() {
    return this.children.filter((c) => c.constructor === TestSuite);
  }
  get childrenTest() {
    return this.children.filter((c) => c.constructor === Test);
  }
  get childrenOnly() {
    return this.children.filter((c) => c.only);
  }
  get childrenToRun() {
    let children = this.children;
    if (this.only && this.childrenOnly.length)
      children = children.filter((c) => c.only);
    return children;
  }
  get childSolo() {
    let soloChild = this.children.find((c) => c.solo);

    if (!soloChild)
      for (const childTestSuite of this.childrenTestSuite)
        if (childTestSuite.childSolo) return childTestSuite.childSolo;

    return soloChild;
  }

  async Init() {
    TestSuite.current = this;
    for (const childTestSuite of this.childrenTestSuite) {
      childTestSuite.before.push(...this.before);
      childTestSuite.beforeEach.push(...this.beforeEach);
      childTestSuite.after.push(...this.after);
      childTestSuite.afterEach.push(...this.afterEach);
    }
    for (const child of this.children) await child.Init();
    this.initialized = true;
  }
  async Run() {
    if (!this.initialized) await this.Init();
    this.results = [];

    const _current = TestSuite.current;
    TestSuite.current = this;
    this.before.forEach((fn) => fn());
    for (const child of this.childrenToRun)
      this.results.push(await child.Run());
    this.after.forEach((fn) => fn());
    TestSuite.current = _current;

    this.passed = !this.results.some((r) => !r.passed);
    return new TestResult(this.passed, this.name);
  }

  static FAIL_EMOJIS = (() => {
    const emojis = ["🦆", "🙉", "🐱", "🦄"];
    let current = Math.floor(Math.random() * emojis.length);
    return {
      next: () =>
        emojis[(current = current === emojis.length - 1 ? 0 : current + 1)],
    };
  })();
  Log({ open = false } = {}) {
    const style = (this.passed ? Test.stylePass : Test.styleFail) + ``;
    const title = `${this.displayName} (${this.passingResults.length}/${this.results.length})`;

    let loggedGroup = true;
    if (this.passed) {
      if (this.results.length) {
        if (open || this.only) console.group(`%c✅ ${title}`, style);
        else console.groupCollapsed(`%c✅ ${title}`, style);
      } else loggedGroup = !!console.log(`%c✅ ${title}`, style);
    } else {
      console.group(`%c${TestSuite.FAIL_EMOJIS.next()} ${title}`, style);
    }

    const children =
      this.only && this.childrenOnly.length ? this.childrenOnly : this.children;
    for (const child of children) child.Log();
    if (loggedGroup) console.groupEnd();
  }
}
class TestResult {
  constructor(passed = true, message = "") {
    this.passed = passed;
    this.message = message;
  }

  Log() {
    console.log(
      `%c${this.message || (this.passed ? "passed" : "failed")}`,
      this.passed ? Test.stylePass : Test.styleFail
    );
  }
}

// window globals
{
  window.before = (...fns) =>
    fns.forEach((fn) => TestSuite.current.before.push(fn));
  window.after = (...fns) =>
    fns.forEach((fn) => TestSuite.current.after.push(fn));
  window.beforeEach = (...fns) =>
    fns.forEach((fn) => TestSuite.current.beforeEach.push(fn));
  window.afterEach = (...fns) =>
    fns.forEach((fn) => TestSuite.current.afterEach.push(fn));
  window.assert = (...args) => {
    if (!Test.current) return;

    const result = new TestResult(...args);
    Test.current.results.push(result);
    result.Log();
  };

  window.useTests = (name, fn) => new TestSuite(name, fn) && fn;
  window.it = (name, fn) => new Test(name, fn) && fn;

  window.sleep = (duration) => new Promise((res) => setTimeout(res, duration));
  window.defer = () => new Promise((res) => setTimeout(res, 4));

  window.useSpy = (target, fnKey, callback) => {
    const _ = target[fnKey];
    target[fnKey] = (...args) => {
      const value = _(...args);
      callback(value, ...args);
      return value;
    };
    return () => (target[fnKey] = _);
  };
}

const rootTestSuite = new TestSuite("🦄 TESTS 🦄", () => {
  // useTests("$ A", () => {
  //   it("a", () => assert(true));
  // });
  // it("b", () => assert(false));
});
TestSuite.current = rootTestSuite;

queueMicrotask(async () => {
  await rootTestSuite.Init();

  if (rootTestSuite.solo) {
    await rootTestSuite.Run();
    rootTestSuite.childSolo.Log({ open: true });
  } else if (rootTestSuite.childSolo) {
    await rootTestSuite.childSolo.Run();
    rootTestSuite.childSolo.Log({ open: true });
  } else {
    await rootTestSuite.Run();
    rootTestSuite.Log();
  }
});
