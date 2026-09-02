import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/quiz")({
  component: QuizLayout,
})

function QuizLayout() {
  return <Outlet />
}
