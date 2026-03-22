"use client";

import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";
import { LogOut } from "lucide-react";

import { MainNav } from "@/components/main-nav";
import { MobileNav } from "@/components/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const router = useRouter();

  const onLogout = async () => {
    try {
      await axios.post("/api/admin/logout");
      toast.success("Logged out");
      router.push("/admin/login");
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    }
  }

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <MobileNav />
        <MainNav className="mx-6 hidden lg:flex" />
        <div className="ml-auto flex items-center space-x-4">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={onLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;