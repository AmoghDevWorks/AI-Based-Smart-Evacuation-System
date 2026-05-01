# AI-Based Smart Evacuation System - Client

This is the React frontend for the AI-Based Smart Evacuation System, built with Vite and Tailwind CSS.

## Project Structure

### `/src/components`
- **`Hero.jsx`**: Acts as the main **Dashboard Overview**. It aggregates various dashboard widgets into a responsive CSS grid layout.
- **`Navbar.jsx`**: The top navigation bar. It conditionally renders a minimal theme-switcher for guests, and a comprehensive status/profile bar for authenticated users.
- **`Sidebar.jsx`**: The left-hand navigation menu for the dashboard, allowing users to switch between Live Monitoring, Layouts, Alerts, etc.
- **`/dashboard`**: Contains the modular widgets used in the Overview Dashboard:
  - `LiveCameraFeed.jsx`: A simulated CCTV video feed panel with a people-count overlay.
  - `DensityHeatmap.jsx`: Visualizes zone capacities and crowd density using color-coded statuses.
  - `RiskIndicator.jsx`: Displays a calculated system-wide risk score and label.
  - `AlertsPanel.jsx`: A scrollable list of recent system notifications and warnings.
  - `BuildingMap.jsx`: An SVG-based visualization highlighting rooms and active risk corridors.

### `/src/pages`
- **`Home.jsx`**: The landing page for unauthenticated users, displaying a responsive, two-card layout for Login and Sign Up.
- **`LiveMonitoring.jsx`**: Placeholder page for full-screen camera feeds.
- **`BuildingLayout.jsx`**: Placeholder page for the canvas-based room editor.
- **`AlertsLogs.jsx`**: Placeholder page for historical alert tables.
- **`Settings.jsx`**: Placeholder page for system thresholds and configurations.

### `/src/utils`
- **`appStore.jsx`**: The main Redux store configuration.
- **`themeSlice.jsx`**: Redux slice managing the application's light/dark mode state.
- **`userSlice.jsx`**: Redux slice managing user authentication and session details.

### `/src`
- **`App.jsx`**: The root component handling React Router setup and conditional rendering of the `DashboardLayout` vs the unauthenticated `Home` view.
- **`main.jsx`**: The application entry point that provides the Redux store to the React tree.
