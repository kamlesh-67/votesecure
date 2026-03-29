import { redirect } from "next/navigation";

// Root "/" — redirect to the animated splash screen inside the (voter) route group
export default function RootPage() {
  redirect("/splash");
}
