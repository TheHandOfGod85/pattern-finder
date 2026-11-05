# jsdom dialog support

jsdom 31 — the version pinned by `package-lock.json` — provides `HTMLDialogElement` and the `open` attribute but does not implement `showModal()` or `close()`. A jsdom test that opens a native `<dialog>` fails with `showModal is not a function` unless the test file installs a guarded polyfill before importing the page:

```ts
if (typeof window.HTMLDialogElement.prototype.showModal !== "function") {
  window.HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };

  window.HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
}
```

`tests/app.test.ts` carries this polyfill. Production code uses the native methods — never replace the dialog with a div to make tests pass.
