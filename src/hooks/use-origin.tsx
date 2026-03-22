import { useState, useEffect } from "react";

export const useOrigin = () => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return "";
    }

    return typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
};
