# **Website Requirement Document for Vibe Coding**

## **1\. High-Level Concept**

* **Project Name:** Club Membership Management Portal (MMS)  
* **One-Liner:** A centralized, secure dashboard for club admins to manage member data, track scholarship eligibility, and monitor event attendance/subsidies.  
* **Target Audience:** Club Administrators (Committee members) who need to view, edit, and export student data.

## **2\. The "Vibe" (Design & Aesthetics)**

* **Core Emotion:** Organized, Efficient, Clean, "Notion-esque".  
* **Color Palette:**  
  * **Background:** Clean White (\#FFFFFF) for cards, Soft Light Grey (\#F3F4F6) for the app background.  
  * **Accents:** Professional Navy Blue (\#1e3a8a) for primary actions, subtle Emerald Green (\#10b981) for "Eligible/Yes" tags, and Muted Red (\#ef4444) for "No/Alerts".  
* **Typography Style:**  
  * **Headers:** Inter or system-ui (Clean Sans-Serif), bold and crisp.  
  * **Data:** Monospace numbers for IDs and Phone numbers (e.g., JetBrains Mono or Roboto Mono) to prevent reading errors.  
* **Visual Elements:**  
  * \[x\] Rounded corners (Medium radius, e.g., rounded-lg or rounded-xl)  
  * \[ \] Sharp edges  
  * \[ \] Shadows/Depth (Subtle drop shadows on tables/cards)  
  * \[x\] Flat design (Clean borders, minimal gradients)  
  * \[ \] Glassmorphism  
* **Reference/Inspiration:** "A mix of Airtable's grid view and a modern SaaS settings dashboard. Clean distinct borders, readable padding."

## **3\. Tech Stack (Constraints)**

* **Framework:** **Vue 3 (Vite)**  
  * *Requirement:* Use \<script setup\> (Composition API) for clean, modern code.  
* **State Management:** **Pinia** (for managing auth user and member list state).  
* **Styling:** Tailwind CSS (Strict requirement for rapid UI development).  
* **Icons:** **Lucide Vue** (Clean, standard SVG icons).  
* **Animation:** Minimal. "Keep it snappy." Vue \<Transition\> or TransitionGroup for subtle list entry effects.  
* **Backend/Database:** **Firebase (Free Tier)**  
  * **Auth:** Firebase Authentication (Email/Password for Admins).  
  * **Database:** Firestore (NoSQL). *Crucial for the "Admin can add more fields later" requirement as NoSQL is flexible.*  
  * **Hosting:** Firebase Hosting.

## **4\. Page Structure & Features**

### **A. Auth / Login**

* Simple, centered login card.  
* Email/Password fields.  
* "Admin Access Only" badge.

### **B. Dashboard (Main View)**

* **Header:** "Membership Management System", current Admin user, Logout button.  
* **Stats Row:** Quick count of "Total Members", "Ordinary A Members", "Scholarship Eligible".  
* **Action Bar:**  
  * Search bar (Filter by Name or Campus ID).  
  * Filters (Dropdowns for Membership Type).  
  * **"Export to Excel" Button:** Prominent button to download the full database.  
* **Main Data Table:**  
  * **Columns:**  
    * Campus ID (Compulsory)  
    * Full Name (Compulsory)  
    * Admit Year  
    * **Student Status** (Undergrad/Postgrad/Graduated)  
    * School (Accountancy, Business, Economics, Computing, Law, Social Sciences, CIS)
    * Membership Type (Badge style)  
    * Next Subsidy Rate (Calculated field, e.g., "90%")  
    * Actions (Edit / Delete buttons)

### **C. Add/Edit Member Modal (The Core Form)**

* **Compulsory Fields Section:**  
  * Full Name (Text)  
  * Campus ID (Text/Number)  
  * Admit Year (Number/Year Picker)  
  * Membership Type (Dropdown: Ordinary A, Ordinary B, Associate)  
  * Track (Multi-select or Checkbox: ITI, MBOT, Both, None)  
  * **Degree** (Dropdown: **Undergraduate, Postgraduate, Graduated**).  
  * School Email (Email validation)  
  * Telegram Handle (Text, auto-add '@' if missing)  
  * Phone Number (Number)  
* **ISM Attendance & Subsidy Log (Complex Feature):**  
  * Instead of a simple counter, this section tracks specific events.  
  * **Visual:** A small list/table inside the modal showing "Past ISMs Attended".  
  * **Action:** "Add ISM Attendance" button.  
  * **Input:** When adding an attendance, the Admin selects the ISM Name.  
  * **Logic:** The system *automatically* calculates and saves the "Subsidy Used" for that event based on the logic in Section 5 at the moment of entry.  
* **Optional/Computed Fields Section:**  
  * Reason for Ordinary B (Text Area \- show only if "Ordinary B" selected)  
  * Other Counters: \# NCS Attended, \# ISS Attended.  
  * **Scholarship Logic Display:**  
    * *Visual Indicator:* "Scholarship Eligible?" (Auto-calculated: YES if Ordinary A \+ Never awarded before. NO otherwise).  
  * Track Scholarship Awarded (Checkbox or "Amount" field).  
* **Dynamic Fields Section:**  
  * "Add New Field" button. Allows admin to define a Key (Label) and Value (Input) for unexpected data needs.

## **5\. Specific Functionality Requirements**

* **Export to Excel (Critical):**  
  * One-click download of **ALL** member data into a .xlsx file.  
  * Include the full "Attendance Log" and "Subsidy History" in the export (flatted as needed).  
* **Scholarship Eligibility Logic:**  
  * Highlight "Eligible" if: Membership \== 'Ordinary A' AND Scholarship Awarded History is empty.  
* **Smart Subsidy Logic (Complex Tier System):**  
  * **Concept:** Use a "Tier Consumption" model. We track which percentage tiers a student has *already used* in their history.  
  * **Tiers:**  
    * **Tier 90%:** Exclusive to Ordinary A.  
    * **Tier 70%:** Available to Ordinary A & Ordinary B.  
    * **Tier 50%:** Exclusive to Ordinary A.  
    * **Floor:** 10% (Always available if no other tiers apply).  
  * **Algorithm for "Next Subsidy Rate":**  
    1. Fetch list of subsidies *already used* by this student (e.g., \[70\]).  
    2. **If Associate:** Return **10%** (Always).  
    3. **If Ordinary B:**  
       * Has the 70% tier been used?  
       * **No** \-\> Grant **70%**.  
       * **Yes** \-\> Grant **10%**.  
    4. **If Ordinary A:**  
       * Has the 90% tier been used? **No** \-\> Grant **90%**.  
       * Has the 70% tier been used? **No** \-\> Grant **70%**.  
       * Has the 50% tier been used? **No** \-\> Grant **50%**.  
       * **Else** \-\> Grant **10%**.  
  * **Upgrade Scenario Example:**  
    * Student is Ord B. Attends Event 1\. Uses **70%**. (History: \[70\]).  
    * Student upgrades to Ord A.  
    * Attends Event 2\. System checks Ord A logic:  
      * 90% used? No \-\> Grants **90%**. (History now: \[70, 90\]).  
    * Attends Event 3\. System checks Ord A logic:  
      * 90% used? Yes.  
      * 70% used? Yes (from when they were Ord B).  
      * 50% used? No \-\> Grants **50%**.

## **6\. Copywriting Tone**

* Professional, Internal-Tool style. No slang. Clear labels.

## **7\. Assets / Data Schema Reference**

* *Based on uploaded CSVs:*  
* **Membership Types:** Ordinary A, Ordinary B, Associate.  
* **Tracks:** ITT, MBOT.  
* **Subsidy Tiers:** 0=90%, 1=70%, 2=50%, 3=10%.