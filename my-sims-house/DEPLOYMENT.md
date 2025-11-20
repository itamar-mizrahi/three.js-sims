# 🚀 Deployment Guide

האפליקציה מוגדרת לדיפלוי אוטומטי ל-GitHub Pages דרך GitHub Actions.

## הגדרת GitHub Pages (פעם אחת)

1. לך ל-repository settings ב-GitHub:
   ```
   https://github.com/itamar-mizrahi/three.js-sims/settings/pages
   ```

2. תחת **Source**, בחר:
   - **Source**: `GitHub Actions`

3. שמור את ההגדרות

## איך זה עובד?

כל פעם שאתה עושה `push` ל-branch `main`, GitHub Actions:
1. ✅ מתקין את התלויות
2. ✅ בונה את הפרויקט (`npm run build`)
3. ✅ מפרסם את התוצאה ל-GitHub Pages

## צפייה בסטטוס הדיפלוי

לאחר push, אתה יכול לראות את סטטוס הדיפלוי ב:
```
https://github.com/itamar-mizrahi/three.js-sims/actions
```

## הקישור לאתר

לאחר דיפלוי מוצלח, האפליקציה תהיה זמינה ב:
```
https://itamar-mizrahi.github.io/three.js-sims/
```

## Local Development

כדי לבדוק את הבנייה באופן מקומי לפני push:

```bash
# בנה את הפרויקט
npm run build

# צפה בגרסת הפרודקשן
npm run preview
```

## Troubleshooting

### הדיפלוי נכשל?
- בדוק את לוגים ב-Actions tab
- ודא ש-GitHub Pages מופעל ב-repository settings
- ודא שיש לך הרשאות כתיבה ל-repository

### משאבים לא נטענים?
- ודא שה-`base` ב-`vite.config.js` מוגדר ל-`'/three.js-sims/'`
- נקה cache וטען מחדש את הדף

### רוצה לשנות את שם ה-repository?
אם תשנה את שם ה-repository, עדכן את ה-`base` ב-`vite.config.js` בהתאם.
