# Logo Instructions

## 📁 Where to Place Your Logo

Add your logo file to the `public` folder with the name:

- `logo.png` (recommended: 512x512px or larger, square format)

OR if you prefer SVG:

- Rename your file to `logo.svg`
- Update `index.html` line 5 to: `<link rel="icon" type="image/svg+xml" href="/logo.svg">`

## 🎨 Logo Requirements

**For PNG:**

- Size: 512x512px (minimum 192x192px)
- Format: PNG with transparent background
- Square format works best for favicons

**For SVG:**

- Vector format for crisp display at any size
- Keep it simple for small favicon display

## 📂 File Location

Place your logo here:

```
mms-membership/
├── public/
│   └── logo.png  ← Place your logo here
├── src/
├── index.html
└── ...
```

## 🔄 After Adding Your Logo

1. Save your logo file as `logo.png` in the `public` folder
2. The change will appear immediately in your dev server
3. Run `npm run build` and `firebase deploy --only hosting` to update the live site

## 💡 Quick Tips

- The logo appears in the browser tab (favicon)
- Also appears when adding site to home screen on mobile
- Keep design simple - it displays very small in browser tabs
- Use high contrast for visibility
