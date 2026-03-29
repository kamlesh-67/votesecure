import { redirect } from "next/navigation";
// (voter)/page.tsx captures "/" within the route group.
// Redirect to the animated splash screen.
export default function VoterRoot() {
  redirect("/splash");
}
