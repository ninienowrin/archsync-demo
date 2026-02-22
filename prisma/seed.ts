import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  // Clear all data (order matters due to foreign keys)
  await prisma.activity.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  // ── Users ──
  const rahim = await prisma.user.create({
    data: { name: "Rahim Ahmed", email: "rahim@studiodhaka.com", password: hash("demo1234"), role: "Lead Architect", systemRole: "project_manager" },
  });
  const fatima = await prisma.user.create({
    data: { name: "Fatima Khan", email: "fatima@studiodhaka.com", password: hash("demo1234"), role: "Site Engineer" },
  });
  const arif = await prisma.user.create({
    data: { name: "Arif Hossain", email: "arif@studiodhaka.com", password: hash("demo1234"), role: "Design Coordinator" },
  });
  const nadia = await prisma.user.create({
    data: { name: "Nadia Rahman", email: "nadia@studiodhaka.com", systemRole: "admin", password: hash("demo1234"), role: "Project Manager" },
  });

  // ── Projects (with phases) ──
  const project1 = await prisma.project.create({
    data: {
      name: "Gulshan Tower Complex",
      description: "25-story mixed-use tower in Gulshan-2 featuring commercial floors, luxury apartments, and rooftop amenities.",
      status: "active",
      phase: "construction_docs",
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: "Dhaka Waterfront Pavilion",
      description: "Eco-friendly public pavilion along Hatirjheel lakefront with event spaces, cafes, and an amphitheater.",
      status: "active",
      phase: "design_development",
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: "Mirpur Community Center",
      description: "Multi-purpose community center with library, sports facilities, co-working space, and childcare wing.",
      status: "planning",
      phase: "schematic_design",
    },
  });

  // ── Project Members ──
  await prisma.projectMember.createMany({
    data: [
      // Gulshan Tower — everyone involved
      { projectId: project1.id, userId: nadia.id, role: "owner" },
      { projectId: project1.id, userId: rahim.id, role: "manager" },
      { projectId: project1.id, userId: fatima.id, role: "member" },
      { projectId: project1.id, userId: arif.id, role: "member" },
      // Waterfront Pavilion
      { projectId: project2.id, userId: nadia.id, role: "owner" },
      { projectId: project2.id, userId: rahim.id, role: "member" },
      { projectId: project2.id, userId: fatima.id, role: "member" },
      { projectId: project2.id, userId: arif.id, role: "member" },
      // Community Center
      { projectId: project3.id, userId: nadia.id, role: "owner" },
      { projectId: project3.id, userId: rahim.id, role: "member" },
      { projectId: project3.id, userId: arif.id, role: "member" },
    ],
  });

  // ── Tasks (individually to capture IDs for comments/activities) ──

  // Project 1: Gulshan Tower Complex
  const t1 = await prisma.task.create({
    data: { title: "Foundation blueprint review", description: "Review and approve foundation structural drawings", status: "done", priority: "high", tags: ["structural"], position: 0, projectId: project1.id, assigneeId: rahim.id, dueDate: new Date("2026-02-15"), createdAt: daysAgo(14), updatedAt: daysAgo(7) },
  });
  const t2 = await prisma.task.create({
    data: { title: "Structural load analysis", description: "Complete load-bearing analysis for floors 1-10", status: "done", priority: "high", tags: ["structural", "engineering"], position: 1, projectId: project1.id, assigneeId: fatima.id, dueDate: new Date("2026-02-20"), createdAt: daysAgo(13), updatedAt: daysAgo(5) },
  });
  const t3 = await prisma.task.create({
    data: { title: "Elevator shaft design", description: "Finalize elevator shaft placement and structural integration", status: "review", priority: "high", tags: ["structural", "mechanical"], position: 0, projectId: project1.id, assigneeId: arif.id, dueDate: new Date("2026-03-01"), createdAt: daysAgo(12), updatedAt: daysAgo(2) },
  });
  const t4 = await prisma.task.create({
    data: { title: "Parking layout optimization", description: "Redesign basement parking for 200+ vehicle capacity", status: "in_progress", priority: "medium", tags: ["architectural"], position: 0, projectId: project1.id, assigneeId: arif.id, dueDate: new Date("2026-03-05"), createdAt: daysAgo(11), updatedAt: daysAgo(1) },
  });
  const t5 = await prisma.task.create({
    data: { title: "HVAC system planning", description: "Design central HVAC routing for all residential floors", status: "in_progress", priority: "medium", tags: ["hvac", "mechanical"], position: 1, projectId: project1.id, assigneeId: fatima.id, dueDate: new Date("2026-03-10"), createdAt: daysAgo(10), updatedAt: daysAgo(1) },
  });
  const t6 = await prisma.task.create({
    data: { title: "Fire safety compliance audit", description: "Ensure design meets BNBC fire safety codes", status: "backlog", priority: "high", tags: ["safety", "compliance"], position: 0, projectId: project1.id, assigneeId: nadia.id, dueDate: new Date("2026-03-15"), createdAt: daysAgo(9), updatedAt: daysAgo(9) },
  });
  const t7 = await prisma.task.create({
    data: { title: "Facade material selection", description: "Select exterior cladding materials and finishes", status: "backlog", priority: "low", tags: ["architectural", "materials"], position: 1, projectId: project1.id, assigneeId: rahim.id, dueDate: new Date("2026-03-20"), createdAt: daysAgo(8), updatedAt: daysAgo(8) },
  });
  const t8 = await prisma.task.create({
    data: { title: "Client presentation deck", description: "Prepare 3D renders and progress presentation for client meeting", status: "backlog", priority: "medium", tags: ["management"], position: 2, projectId: project1.id, assigneeId: nadia.id, dueDate: new Date("2026-03-25"), createdAt: daysAgo(7), updatedAt: daysAgo(7) },
  });

  // Project 2: Dhaka Waterfront Pavilion
  const t9 = await prisma.task.create({
    data: { title: "Site topography survey", description: "Complete detailed topographic survey of the lakefront area", status: "done", priority: "high", tags: ["surveying"], position: 0, projectId: project2.id, assigneeId: fatima.id, dueDate: new Date("2026-02-10"), createdAt: daysAgo(14), updatedAt: daysAgo(10) },
  });
  const t10 = await prisma.task.create({
    data: { title: "Environmental impact assessment", description: "Submit EIA report to Department of Environment", status: "review", priority: "high", tags: ["compliance", "environmental"], position: 0, projectId: project2.id, assigneeId: nadia.id, dueDate: new Date("2026-02-28"), createdAt: daysAgo(13), updatedAt: daysAgo(3) },
  });
  const t11 = await prisma.task.create({
    data: { title: "Amphitheater acoustics design", description: "Design open-air acoustics for 500-seat amphitheater", status: "in_progress", priority: "medium", tags: ["architectural", "acoustic"], position: 0, projectId: project2.id, assigneeId: rahim.id, dueDate: new Date("2026-03-05"), createdAt: daysAgo(11), updatedAt: daysAgo(2) },
  });
  const t12 = await prisma.task.create({
    data: { title: "Green roof specification", description: "Specify plants and irrigation for rooftop garden", status: "in_progress", priority: "low", tags: ["landscape", "sustainability"], position: 1, projectId: project2.id, assigneeId: arif.id, dueDate: new Date("2026-03-12"), createdAt: daysAgo(10), updatedAt: daysAgo(1) },
  });
  const t13 = await prisma.task.create({
    data: { title: "Waterproofing plan", description: "Design waterproofing for below-grade and lakeside structures", status: "backlog", priority: "high", tags: ["structural", "materials"], position: 0, projectId: project2.id, assigneeId: fatima.id, dueDate: new Date("2026-03-18"), createdAt: daysAgo(8), updatedAt: daysAgo(8) },
  });
  const t14 = await prisma.task.create({
    data: { title: "Lighting concept design", description: "Create ambient lighting scheme for evening events", status: "backlog", priority: "low", tags: ["electrical", "interior"], position: 1, projectId: project2.id, assigneeId: arif.id, dueDate: new Date("2026-03-22"), createdAt: daysAgo(6), updatedAt: daysAgo(6) },
  });

  // Project 3: Mirpur Community Center
  const t15 = await prisma.task.create({
    data: { title: "Stakeholder requirements gathering", description: "Interview community leaders for facility requirements", status: "done", priority: "high", tags: ["management"], position: 0, projectId: project3.id, assigneeId: nadia.id, dueDate: new Date("2026-02-08"), createdAt: daysAgo(14), updatedAt: daysAgo(12) },
  });
  const t16 = await prisma.task.create({
    data: { title: "Zoning compliance check", description: "Verify site zoning permits community facility use", status: "review", priority: "high", tags: ["compliance", "legal"], position: 0, projectId: project3.id, assigneeId: nadia.id, dueDate: new Date("2026-02-25"), createdAt: daysAgo(12), updatedAt: daysAgo(4) },
  });
  const t17 = await prisma.task.create({
    data: { title: "Space allocation planning", description: "Draft floor plans for library, gym, and co-working areas", status: "in_progress", priority: "medium", tags: ["architectural", "interior"], position: 0, projectId: project3.id, assigneeId: rahim.id, dueDate: new Date("2026-03-03"), createdAt: daysAgo(10), updatedAt: daysAgo(1) },
  });
  const t18 = await prisma.task.create({
    data: { title: "Accessibility audit", description: "Ensure design meets accessibility standards throughout", status: "backlog", priority: "high", tags: ["compliance", "architectural"], position: 0, projectId: project3.id, assigneeId: arif.id, dueDate: new Date("2026-03-10"), createdAt: daysAgo(7), updatedAt: daysAgo(7) },
  });
  const t19 = await prisma.task.create({
    data: { title: "Budget estimation", description: "Prepare detailed cost estimate for all construction phases", status: "backlog", priority: "medium", tags: ["management", "finance"], position: 1, projectId: project3.id, assigneeId: nadia.id, dueDate: new Date("2026-03-15"), createdAt: daysAgo(5), updatedAt: daysAgo(5) },
  });

  // ── Comments ──
  await prisma.comment.createMany({
    data: [
      { body: "Foundation drawings look good. Minor revision needed on column spacing near the elevator core.", taskId: t1.id, authorId: rahim.id, createdAt: daysAgo(8) },
      { body: "Load analysis for floors 1-5 complete. Starting 6-10 this week. No structural concerns so far.", taskId: t2.id, authorId: fatima.id, createdAt: daysAgo(6) },
      { body: "Elevator shaft placement conflicts with the HVAC duct routing on floor 12. Need to coordinate with Fatima.", taskId: t3.id, authorId: arif.id, createdAt: daysAgo(3) },
      { body: "Updated the parking layout to accommodate 215 vehicles. Added EV charging stations on level B1.", taskId: t4.id, authorId: arif.id, createdAt: daysAgo(1) },
      { body: "EIA report submitted. Waiting for DoE review — typically 2-3 weeks turnaround.", taskId: t10.id, authorId: nadia.id, createdAt: daysAgo(4) },
      { body: "Acoustic modeling shows we need sound barriers on the north side to reduce traffic noise.", taskId: t11.id, authorId: rahim.id, createdAt: daysAgo(2) },
      { body: "Community leaders requested dedicated prayer room and larger library space. Updated requirements doc.", taskId: t15.id, authorId: nadia.id, createdAt: daysAgo(12) },
      { body: "Zoning is approved for community use. Need to verify height restrictions before proceeding.", taskId: t16.id, authorId: nadia.id, createdAt: daysAgo(5) },
    ],
  });

  // ── Activity Feed ──
  await prisma.activity.createMany({
    data: [
      { action: "project.created", projectId: project1.id, userId: nadia.id, details: { name: "Gulshan Tower Complex" }, createdAt: daysAgo(14) },
      { action: "project.created", projectId: project2.id, userId: nadia.id, details: { name: "Dhaka Waterfront Pavilion" }, createdAt: daysAgo(14) },
      { action: "project.created", projectId: project3.id, userId: nadia.id, details: { name: "Mirpur Community Center" }, createdAt: daysAgo(14) },
      { action: "task.created", projectId: project1.id, taskId: t1.id, userId: nadia.id, details: { title: "Foundation blueprint review" }, createdAt: daysAgo(14) },
      { action: "task.status_changed", projectId: project1.id, taskId: t1.id, userId: rahim.id, details: { from: "in_progress", to: "done" }, createdAt: daysAgo(7) },
      { action: "task.status_changed", projectId: project1.id, taskId: t2.id, userId: fatima.id, details: { from: "review", to: "done" }, createdAt: daysAgo(5) },
      { action: "task.status_changed", projectId: project1.id, taskId: t3.id, userId: arif.id, details: { from: "in_progress", to: "review" }, createdAt: daysAgo(2) },
      { action: "comment.added", projectId: project1.id, taskId: t3.id, userId: arif.id, createdAt: daysAgo(3) },
      { action: "task.status_changed", projectId: project2.id, taskId: t9.id, userId: fatima.id, details: { from: "review", to: "done" }, createdAt: daysAgo(10) },
      { action: "task.status_changed", projectId: project2.id, taskId: t10.id, userId: nadia.id, details: { from: "in_progress", to: "review" }, createdAt: daysAgo(3) },
      { action: "comment.added", projectId: project2.id, taskId: t10.id, userId: nadia.id, createdAt: daysAgo(4) },
      { action: "task.status_changed", projectId: project2.id, taskId: t12.id, userId: arif.id, details: { from: "backlog", to: "in_progress" }, createdAt: daysAgo(1) },
      { action: "task.status_changed", projectId: project3.id, taskId: t15.id, userId: nadia.id, details: { from: "in_progress", to: "done" }, createdAt: daysAgo(12) },
      { action: "task.status_changed", projectId: project3.id, taskId: t16.id, userId: nadia.id, details: { from: "in_progress", to: "review" }, createdAt: daysAgo(4) },
      { action: "task.created", projectId: project3.id, taskId: t19.id, userId: nadia.id, details: { title: "Budget estimation" }, createdAt: daysAgo(5) },
      { action: "comment.added", projectId: project1.id, taskId: t4.id, userId: arif.id, createdAt: daysAgo(1) },
    ],
  });

  console.log("Seed data created successfully!");
  console.log("  - 4 team members, 3 projects, 19 tasks");
  console.log("  - 11 project memberships, 8 comments, 16 activities");
  console.log("\nLogin credentials (all passwords: demo1234):");
  console.log("  nadia@studiodhaka.com  (Admin)");
  console.log("  rahim@studiodhaka.com  (Project Manager)");
  console.log("  fatima@studiodhaka.com (Employee)");
  console.log("  arif@studiodhaka.com   (Employee)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
