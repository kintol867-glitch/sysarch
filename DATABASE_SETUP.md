# Database Setup

This project now supports saving students in MySQL through PHP.

## 1. Run with XAMPP

Copy or move the `Andaless` folder into:

```text
C:\xampp\htdocs\
```

Start XAMPP:

- Apache
- MySQL

Open the site through:

```text
http://localhost/Andaless/
```

Do not open `index.html` directly from the file explorer if you want the database to work.

## 2. Create the Database

Open phpMyAdmin:

```text
http://localhost/phpmyadmin
```

Import this file:

```text
Andaless/api/schema.sql
```

That creates:

```text
ccs_sitin_db
students
```

## 3. What Uses the Database

Student data now saves to MySQL when PHP/MySQL is available:

- Student registration
- Student login
- Student list add/edit/delete
- Profile edits
- Remaining session updates when sit-ins are ended

If PHP/MySQL is not running, the app falls back to browser `localStorage`.
