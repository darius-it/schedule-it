
<img alt="schedule-it banner" src="https://github.com/user-attachments/assets/9ec1d6e1-8a72-4c27-9ca5-3804c71f6c84" width="100%"/>
<br><br>

A simple and intuitive scheduling application that helps you manage your time effectively. Schedule-it allows users to create, edit, and organize events, and collaborate with others on shared calendars. Built with React, TailwindCSS, shadcn/ui and Supabase.

Try it out here: https://schedule-it-now.netlify.app


## Demo
![image](https://github.com/user-attachments/assets/96b182c7-65a1-4e26-ad01-1b1e6efd213e)

![demo image 1](https://github.com/user-attachments/assets/3644d9dc-b0c3-44a4-9891-d13c79acddf0)

## Deployment
These are the necessary steps to host the app yourself if you do not want to use the [deployed version](https://schedule-it-now.netlify.app):

1. Build the app using `pnpm build` and deploy to Netlify, Vercel, GitHub Pages, etc.
2. Create a new Supabase project
3. Populate the following environment variables (either in an .env file or using the Environment Variables option of your host):
   `VITE_SUPABASE_URL`(your Supabase project URL) and `VITE_SUPABASE_ANON_KEY` (your Supabase anon key).
4. Create following database tables (make sure RLS is disabled, these tables are supposed to be publicly available through their id):
   
    - **schedules**:
      | id (primary key)  | title | name | icon | created_at |
      |-----|-------|------|------|------------|
      | text (unique) | text | text | text | timestamptz |


   - **appointments**:
       | id (primary key)  | schedule (foreign key rel -> id of schedules; cascade) | name | start_time | end_time | created_at |
       |-----|----------|------|------------|----------|------------|
       | int8 | text    | text  | timestamptz | timestamptz | timestamptz |

5. You're ready to go! Enjoy!


## Planned Features
- [x] Generate project slugs using dictionary words (e.g. funny-tortoise-book); should be unique so they can be used as an ID
- [x] Create new table for schedules and link it to appointments using a foreign key relation
- [x] Save newly created schedules to localstorage and also allow add button to add them from slug ("My Schedules" section on homepage)
- [x] Turn it into a PWA for more convenient usage from mobile devices
- [x] Add dark/light mode toggle

## Credits
Copyright (c) 2024, darius-it.
Licensed under the BSD 3-Clause License.
