// app/credits/page.tsx
import { CreditPackages } from '@/components/payment/credit-package'
import { currentUser } from '@clerk/nextjs/server'
import Navbar from "@/components/landing/navbar";
import Footer from "@/components/landing/footer";

  
export default async function CreditsPage() {
  const user = await currentUser()
  
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Navbar /> {/* 添加导航栏 */}
      
      <div className="max-w-7xl mx-auto mt-16 px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">购买积分</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            选择适合您的积分套餐，解锁更多 AI Logo 生成功能
          </p>
        </div>
        
        <CreditPackages />
      </div>
      <Footer />
    </div>
  )
}