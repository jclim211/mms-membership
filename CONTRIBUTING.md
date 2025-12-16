# Contributing Policy

## 🚫 Not Accepting Contributions

Thank you for your interest in this project! However, **this repository is not accepting contributions** (pull requests, issues, or feature requests).

## ✅ What You Can Do

You are welcome to:

- **Fork** the repository for your own use
- **Clone** and modify for your organization's needs
- **Learn** from the codebase
- **Adapt** the code for your own projects

## 📋 For Your Own Fork

If you've forked this project, here are some best practices:

### Setting Up Your Fork

1. Clone your fork:

   ```bash
   git clone https://github.com/your-username/mms-membership.git
   cd mms-membership
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment:

   ```bash
   cp .env.example .env
   # Add your Firebase credentials to .env
   ```

4. Start development:
   ```bash
   npm run dev
   ```

### Customization Tips

- **Branding**: Update colors in `tailwind.config.js`
- **Schools**: Modify the school list in member form
- **Fields**: Add/remove fields in `src/utils/bulkImport.js`
- **Rules**: Adjust Firebase security rules for your needs
- **Styling**: Customize Tailwind classes throughout components

## 📚 Documentation

For setup and usage guidance, see:

- [README.md](README.md) - Main project overview
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Installation instructions
- [NON_TECHNICAL_GUIDE.md](NON_TECHNICAL_GUIDE.md) - For non-developers
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Feature list

## 📝 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

You are free to use, modify, and distribute this software as per the MIT License terms.

---

**Note:** If you encounter bugs or want new features, please implement them in your own fork. Pull requests to this repository will not be reviewed or merged.
