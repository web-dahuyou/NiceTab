export default defineContentScript({
  "matches": ["https://*.example.com/*"],
  main() {
    console.log('Hello Nice-Tab.');
  },
});
