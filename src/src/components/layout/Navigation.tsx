import React from "react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { label: "All Games", path: "/" },
  { label: "Live", path: "/live" },
  { label: "Leagues", path: "/league" },
];

const Navigation = () => {
  const { pathname } = useLocation();

  return (
    <nav className="flex gap-4 p-4 border-b bg-background">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`text-sm font-medium ${
            pathname === item.path
              ? "text-primary underline"
              : "text-muted-foreground"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
};

export default Navigation;
