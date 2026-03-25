## 📅 MicroDo - Task Management Application

A modern, high-performance task management application built with **React**, **TypeScript**, and **Vite**. This project focuses on seamless task tracking, intuitive user experience, and professional state management.

📂 **GitHub Repo:** [github.com/bttu2002/TasksManagement](https://github.com/bttu2002/TasksManagement)

---

## 🔥 Key Features

- **Authentication & Authorization:** Secure user login and registration flows using JWT.
- **Kanban Task Board:** Intuitive Kanban-style board to view, update, and manage tasks across 'To Do', 'In Progress', and 'Done' statuses.
- **Advanced Task Filtering & Search:** Instant search by title, robust sorting (deadline/creation dates), pagination, and status filtering.
- **Real-time Dashboard:** A comprehensive overview page visualizing current task progress and workflow metrics based on real user data.
- **Dynamic Theming:** Full **Dark/Light mode** support to enhance user visual experience.
- **Responsive UI:** Fully optimized for Mobile, Tablet, and Desktop using **Tailwind CSS**.

---

## 🛠 Tech Stack

| **Frontend** | ReactJS (Hooks), TypeScript, Tailwind CSS |
| **Build Tool** | Vite (Fast development & optimized build) |
| **State/Store** | Zustand (Global state management) |
| **Routing**| React Router DOM |
| **Icons** | Lucide React |

---

## 💡 Technical Highlights & Problem Solving

### 1. Centralized State Management
By utilizing **Zustand**, I built a clean and lightweight centralized state architecture for both Authentication (`authStore`) and Tasks (`taskStore`). This resolved complex prop-drilling issues, particularly for the Kanban board and filtering logic, enabling instant UI synchronization when query parameters (search, sort, pagination) change.

### 2. Type-Safe Development
By utilizing **TypeScript**, I defined strict interfaces for API requests/responses, contexts, and component props. This proactive typing reduced runtime errors, improved code readability, and ensured that the frontend stays strictly aligned with the backend's data contracts.

### 3. Modern Styling Workflow
Using **Tailwind CSS**, I implemented a utility-first approach that allowed for rapid UI prototyping. Creating a custom layout containing sticky headers, a collapsible sidebar, and responsive CSS grids for the Kanban board columns ensures the app works smoothly across any device.

---

## 🏃‍♂️ Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/bttu2002/TasksManagement.git
   ```

2.  **Navigate to Frontend & Install dependencies:**

    ```bash
    cd MicroDo_Frontend
    npm install
    ```

3.  **Run the development server:**

    ```bash
    npm run dev
    ```

-----

## 📮 Contact

**Bui Thanh Tu** - Frontend Developer
  - **Phone:** 0935648545
  - **Gmail:** bttu2002@gmail.com
  - **LinkedIn** [@bttu2002](https://www.linkedin.com/in/bttu2002)
  - **GitHub:** [@bttu2002](https://www.github.com/bttu2002)
-----

*Developed with ❤️ and Passion for clean code.*
