# Portfolio Project

## Admin Dashboard Testing
- [ ] /admin/login — login with correct credentials redirects to /admin
- [ ] /admin/login — wrong password shows { "error": "Invalid credentials" } block
- [ ] /admin — dashboard shows correct counts from API
- [ ] /admin/projects — Create: fill form, submit, new row appears in table
- [ ] /admin/projects — Edit: open existing, change title, save, table updates
- [ ] /admin/projects — Delete: click delete, confirm modal appears, confirm, row removed
- [ ] /admin/skills — proficiency slider updates bar preview in form
- [ ] /admin/experience — isCurrent toggle disables endDate field
- [ ] /admin/articles — Publish toggle changes status pill in table row
- [ ] /admin/articles — slug preview updates live as title is typed
- [ ] /admin/messages — unread messages show amber left border
- [ ] /admin/messages — Mark as read removes amber styling
- [ ] Escape key closes any open modal
- [ ] Toast appears after every create/update/delete
- [ ] Logout button clears auth and redirects to /admin/login
- [ ] Visiting /admin without auth redirects to /admin/login
