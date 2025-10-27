// "use client";
// import { SignedIn, UserButton } from "@clerk/nextjs";
// import { domain } from "@/lib/domain";
// import { SignInButton } from "@clerk/nextjs";
// import { SignedOut } from "@clerk/nextjs";
// import Link from "next/link";
// import React, { useEffect, useState } from "react";
// import { Button } from "../ui/button";
// import { LoaderIcon } from "lucide-react";
// import { ToggleTheme } from "../theme-toggler";

// export default function Navbar() {
//   const [isMounted, setIsMounted] = useState(false);
//   useEffect(() => {
//     setIsMounted(true);
//   }, []);
//   return (
//     <header className="fixed max-w-6xl mx-auto px-4 top-0 left-0 right-0 z-50">
//       <nav className="border border-accent/50 backdrop-blur-md text-sm rounded-xl mt-4 flex justify-between items-center py-2 px-5">
//         <Link href="/" className="font-semibold flex-1">
//           LogoAI
//         </Link>
//         <div className="hidden md:flex items-center font-semibold space-x-8">
//           <Link href="/#features">Features</Link>
//           <Link href="/#faq">FAQs</Link>
//           <Link href="/gallery">Gallery</Link>
//           <Link href="/3D">3D Viewer</Link> 
//           <Link href="/credits">Billing</Link> 
//         </div>
//         <div className="flex items-center flex-1 justify-end space-x-4">
//           <ToggleTheme />
//           {!isMounted && (
//             <Button>
//               <LoaderIcon className="animate-spin" />
//             </Button>
//           )}
//           <SignedOut>
//             <SignInButton
//               signUpForceRedirectUrl={`${domain}/generate`}
//               forceRedirectUrl={`${domain}/generate`}
//               mode="modal"
//             >
//               <Button className="text-sm">Sign In</Button>
//             </SignInButton>
//           </SignedOut>
//           <SignedIn>
//               <UserButton 
//               userProfileUrl="/profile" 
//               // userProfileMode="navigation" 
//               />
//           </SignedIn>
//         </div>
//       </nav>
//     </header>
//   );
// }


"use client";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { domain } from "@/lib/domain";
import { SignInButton } from "@clerk/nextjs";
import { SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { LoaderIcon } from "lucide-react";
import { ToggleTheme } from "../theme-toggler";
import { useAdmin } from "@/hooks/use-admin";

export default function Navbar() {
  const [isMounted, setIsMounted] = useState(false);
  const { isAdmin, isLoading } = useAdmin();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <header className="fixed max-w-6xl mx-auto px-4 top-0 left-0 right-0 z-50">
      <nav className="border border-accent/50 backdrop-blur-md text-sm rounded-xl mt-4 flex justify-between items-center py-2 px-5">
        <Link href="/" className="font-semibold flex-1">
          LogoAI
        </Link>
        <div className="hidden md:flex items-center font-semibold space-x-8">
          <Link href="/#features">Features</Link>
          <Link href="/#faq">FAQs</Link>
          <Link href="/gallery">Gallery</Link>
          <Link href="/3D">3D Viewer</Link> 
          <Link href="/credits">Billing</Link> 
          {/* 管理员专属链接 */}
          {isAdmin && (
            <Link href="/admin/dashboard" className="text-primary font-bold">
              Admin
            </Link>
          )}
        </div>
        <div className="flex items-center flex-1 justify-end space-x-4">
          <ToggleTheme />
          {!isMounted || isLoading ? (
            <Button>
              <LoaderIcon className="animate-spin" />
            </Button>
          ) : null}
          <SignedOut>
            <SignInButton
              signUpForceRedirectUrl={`${domain}/`}
              forceRedirectUrl={`${domain}/`}
              mode="modal"
            >
              <Button className="text-sm">Sign In</Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <div className="flex items-center space-x-4">
              {/* 移动端管理员链接 */}
              {isAdmin && (
                <Link 
                  href="/admin" 
                  className="md:hidden text-primary font-bold text-sm"
                >
                  Admin
                </Link>
              )}
              <UserButton 
                userProfileUrl="/profile" 
              />
            </div>
          </SignedIn>
        </div>
      </nav>
    </header>
  );
}