// app/planner/[id]/layout.js
export default function TravelPlanLayout({ children }) {
    return (
      <div className="travel-plan-layout">
        <main>{children}</main>
      </div>
    );
  }