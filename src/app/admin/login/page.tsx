"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/login', { username, password });
      toast.success("Logged in successfully");
      router.push('/admin');
      router.refresh();
    } catch {
      toast.error("Invalid credentials or server error");
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-black">
        <form onSubmit={onSubmit} className="flex flex-col gap-4 p-8 border rounded-lg shadow-sm bg-white dark:bg-neutral-900 w-full max-w-sm">
            <h1 className="text-2xl font-bold text-center">Admin Access</h1>
            <p className="text-gray-500 text-sm text-center mb-4">Fluidlife Dashboard</p>
            <input 
              type="text" 
              placeholder="Username" 
              className="border p-2 rounded dark:bg-black dark:border-neutral-800" 
              value={username} onChange={e => setUsername(e.target.value)} 
            />
            <input 
              type="password" 
              placeholder="Password" 
              className="border p-2 rounded dark:bg-black dark:border-neutral-800" 
              value={password} onChange={e => setPassword(e.target.value)} 
            />
            <button type="submit" className="bg-black text-white p-2 rounded mt-2 hover:bg-neutral-800 transition dark:bg-white dark:text-black">
                Sign In
            </button>
        </form>
    </div>
  )
}
