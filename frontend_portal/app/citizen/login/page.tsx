// "use client"

// import type React from "react"

// import { useState } from "react"
// import { useRouter } from "next/navigation"
// import Link from "next/link"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { InputField } from "@/components/reusables/input-field"
// import { api } from "@/services/api"
// import { setStoredToken } from "@/services/helpers"

// export default function LoginPage() {
//   const router = useRouter()
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState("")
//   const [form, setForm] = useState({ username: "", password: "" })

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setLoading(true)
//     try {
//       const res = await api.auth.login(form)
//       setStoredToken(res.access)
//       router.push("/citizen/home")
//     } catch {
//       setError("Invalid credentials")
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-background to-muted">
//       <Card className="w-full max-w-md">
//         <CardHeader>
//           <CardTitle>Welcome Back</CardTitle>
//           <CardDescription>Login to your account</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <InputField
//               label="Username"
//               value={form.username}
//               onChange={(e) => setForm({ ...form, username: e.target.value })}
//               placeholder="your_username"
//             />
//             <InputField
//               label="Password"
//               type="password"
//               value={form.password}
//               onChange={(e) => setForm({ ...form, password: e.target.value })}
//               placeholder="Enter your password"
//             />
//             {error && <p className="text-sm text-destructive">{error}</p>}
//             <Button disabled={loading} className="w-full">
//               {loading ? "Logging in..." : "Login"}
//             </Button>
//           </form>
//           <p className="text-sm text-center mt-4">
//             Don't have an account?{" "}
//             <Link href="/citizen/register" className="text-primary hover:underline">
//               Register
//             </Link>
//           </p>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }
