import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function futureDate(daysFromNow: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
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

  // ── Users (10 team members) ──────────────────────────────
  const nadia = await prisma.user.create({
    data: { name: "Nadia Rahman", email: "nadia@studiodhaka.com", systemRole: "admin", password: hash("demo1234"), role: "Principal Architect" },
  });
  const rahim = await prisma.user.create({
    data: { name: "Rahim Ahmed", email: "rahim@studiodhaka.com", password: hash("demo1234"), role: "Lead Architect", systemRole: "project_manager" },
  });
  const fatima = await prisma.user.create({
    data: { name: "Fatima Khan", email: "fatima@studiodhaka.com", password: hash("demo1234"), role: "Senior Structural Engineer", systemRole: "project_manager" },
  });
  const sadia = await prisma.user.create({
    data: { name: "Sadia Begum", email: "sadia@studiodhaka.com", password: hash("demo1234"), role: "Interior Design Lead", systemRole: "project_manager" },
  });
  const arif = await prisma.user.create({
    data: { name: "Arif Hossain", email: "arif@studiodhaka.com", password: hash("demo1234"), role: "Design Coordinator" },
  });
  const tanvir = await prisma.user.create({
    data: { name: "Tanvir Chowdhury", email: "tanvir@studiodhaka.com", password: hash("demo1234"), role: "MEP Engineer" },
  });
  const imran = await prisma.user.create({
    data: { name: "Imran Uddin", email: "imran@studiodhaka.com", password: hash("demo1234"), role: "Site Engineer" },
  });
  const ruksana = await prisma.user.create({
    data: { name: "Ruksana Akter", email: "ruksana@studiodhaka.com", password: hash("demo1234"), role: "Landscape Architect" },
  });
  const kamal = await prisma.user.create({
    data: { name: "Kamal Hasan", email: "kamal@studiodhaka.com", password: hash("demo1234"), role: "Quantity Surveyor" },
  });
  const priya = await prisma.user.create({
    data: { name: "Priya Das", email: "priya@studiodhaka.com", password: hash("demo1234"), role: "Junior Architect" },
  });

  // ── Projects (3 projects, each with a different PM) ──────
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

  // ── Project Members (different teams per project) ────────
  await prisma.projectMember.createMany({
    data: [
      // Gulshan Tower — PM: Rahim, Team: Fatima, Arif, Tanvir, Kamal
      { projectId: project1.id, userId: nadia.id, role: "owner" },
      { projectId: project1.id, userId: rahim.id, role: "manager" },
      { projectId: project1.id, userId: fatima.id, role: "member" },
      { projectId: project1.id, userId: arif.id, role: "member" },
      { projectId: project1.id, userId: tanvir.id, role: "member" },
      { projectId: project1.id, userId: kamal.id, role: "member" },

      // Waterfront Pavilion — PM: Fatima, Team: Rahim, Ruksana, Priya, Arif
      { projectId: project2.id, userId: nadia.id, role: "owner" },
      { projectId: project2.id, userId: fatima.id, role: "manager" },
      { projectId: project2.id, userId: rahim.id, role: "member" },
      { projectId: project2.id, userId: ruksana.id, role: "member" },
      { projectId: project2.id, userId: priya.id, role: "member" },
      { projectId: project2.id, userId: arif.id, role: "member" },

      // Community Center — PM: Sadia, Team: Imran, Ruksana, Kamal, Priya
      { projectId: project3.id, userId: nadia.id, role: "owner" },
      { projectId: project3.id, userId: sadia.id, role: "manager" },
      { projectId: project3.id, userId: imran.id, role: "member" },
      { projectId: project3.id, userId: ruksana.id, role: "member" },
      { projectId: project3.id, userId: kamal.id, role: "member" },
      { projectId: project3.id, userId: priya.id, role: "member" },
    ],
  });

  // ── Tasks ────────────────────────────────────────────────

  // Project 1: Gulshan Tower Complex (PM: Rahim)
  const t1 = await prisma.task.create({
    data: { title: "Foundation blueprint review", description: "Review and approve foundation structural drawings", status: "done", priority: "high", tags: ["structural"], position: 0, projectId: project1.id, assigneeId: rahim.id, dueDate: daysAgo(3), createdAt: daysAgo(14), updatedAt: daysAgo(7) },
  });
  const t2 = await prisma.task.create({
    data: { title: "Structural load analysis", description: "Complete load-bearing analysis for floors 1-10", status: "done", priority: "high", tags: ["structural", "engineering"], position: 1, projectId: project1.id, assigneeId: fatima.id, dueDate: daysAgo(1), createdAt: daysAgo(13), updatedAt: daysAgo(5) },
  });
  const t3 = await prisma.task.create({
    data: { title: "Elevator shaft design", description: "Finalize elevator shaft placement and structural integration", status: "review", priority: "high", tags: ["structural", "mechanical"], position: 0, projectId: project1.id, assigneeId: arif.id, dueDate: futureDate(7), createdAt: daysAgo(12), updatedAt: daysAgo(2) },
  });
  const t4 = await prisma.task.create({
    data: { title: "Parking layout optimization", description: "Redesign basement parking for 200+ vehicle capacity", status: "in_progress", priority: "medium", tags: ["architectural"], position: 0, projectId: project1.id, assigneeId: arif.id, dueDate: futureDate(12), createdAt: daysAgo(11), updatedAt: daysAgo(1) },
  });
  const t5 = await prisma.task.create({
    data: { title: "HVAC system planning", description: "Design central HVAC routing for all residential floors", status: "in_progress", priority: "medium", tags: ["hvac", "mechanical"], position: 1, projectId: project1.id, assigneeId: tanvir.id, dueDate: futureDate(18), createdAt: daysAgo(10), updatedAt: daysAgo(1) },
  });
  const t6 = await prisma.task.create({
    data: { title: "Fire safety compliance audit", description: "Ensure design meets BNBC fire safety codes", status: "backlog", priority: "high", tags: ["safety", "compliance"], position: 0, projectId: project1.id, assigneeId: kamal.id, dueDate: futureDate(22), createdAt: daysAgo(9), updatedAt: daysAgo(9) },
  });
  const t7 = await prisma.task.create({
    data: { title: "Facade material selection", description: "Select exterior cladding materials and finishes", status: "backlog", priority: "low", tags: ["architectural", "materials"], position: 1, projectId: project1.id, assigneeId: rahim.id, dueDate: futureDate(28), createdAt: daysAgo(8), updatedAt: daysAgo(8) },
  });
  const t8 = await prisma.task.create({
    data: { title: "Cost estimate — structural phase", description: "Prepare detailed cost estimate for structural construction", status: "backlog", priority: "medium", tags: ["management", "finance"], position: 2, projectId: project1.id, assigneeId: kamal.id, dueDate: futureDate(30), createdAt: daysAgo(7), updatedAt: daysAgo(7) },
  });
  const t8b = await prisma.task.create({
    data: { title: "Electrical riser diagram", description: "Draft electrical riser diagram for all 25 floors", status: "in_progress", priority: "high", tags: ["electrical", "engineering"], position: 3, projectId: project1.id, assigneeId: tanvir.id, dueDate: futureDate(10), createdAt: daysAgo(6), updatedAt: daysAgo(1) },
  });

  // Project 2: Dhaka Waterfront Pavilion (PM: Fatima)
  const t9 = await prisma.task.create({
    data: { title: "Site topography survey", description: "Complete detailed topographic survey of the lakefront area", status: "done", priority: "high", tags: ["surveying"], position: 0, projectId: project2.id, assigneeId: rahim.id, dueDate: daysAgo(5), createdAt: daysAgo(14), updatedAt: daysAgo(10) },
  });
  const t10 = await prisma.task.create({
    data: { title: "Environmental impact assessment", description: "Submit EIA report to Department of Environment", status: "review", priority: "high", tags: ["compliance", "environmental"], position: 0, projectId: project2.id, assigneeId: fatima.id, dueDate: futureDate(5), createdAt: daysAgo(13), updatedAt: daysAgo(3) },
  });
  const t11 = await prisma.task.create({
    data: { title: "Amphitheater acoustics design", description: "Design open-air acoustics for 500-seat amphitheater", status: "in_progress", priority: "medium", tags: ["architectural", "acoustic"], position: 0, projectId: project2.id, assigneeId: rahim.id, dueDate: futureDate(12), createdAt: daysAgo(11), updatedAt: daysAgo(2) },
  });
  const t12 = await prisma.task.create({
    data: { title: "Green roof specification", description: "Specify plants and irrigation for rooftop garden", status: "in_progress", priority: "low", tags: ["landscape", "sustainability"], position: 1, projectId: project2.id, assigneeId: ruksana.id, dueDate: futureDate(20), createdAt: daysAgo(10), updatedAt: daysAgo(1) },
  });
  const t13 = await prisma.task.create({
    data: { title: "Waterproofing plan", description: "Design waterproofing for below-grade and lakeside structures", status: "backlog", priority: "high", tags: ["structural", "materials"], position: 0, projectId: project2.id, assigneeId: arif.id, dueDate: futureDate(25), createdAt: daysAgo(8), updatedAt: daysAgo(8) },
  });
  const t14 = await prisma.task.create({
    data: { title: "Lighting concept design", description: "Create ambient lighting scheme for evening events", status: "backlog", priority: "low", tags: ["electrical", "interior"], position: 1, projectId: project2.id, assigneeId: priya.id, dueDate: futureDate(30), createdAt: daysAgo(6), updatedAt: daysAgo(6) },
  });
  const t14b = await prisma.task.create({
    data: { title: "Cafe layout & kitchen spec", description: "Design cafe seating layout and commercial kitchen requirements", status: "in_progress", priority: "medium", tags: ["interior", "architectural"], position: 2, projectId: project2.id, assigneeId: priya.id, dueDate: futureDate(15), createdAt: daysAgo(5), updatedAt: daysAgo(1) },
  });
  const t14c = await prisma.task.create({
    data: { title: "Lakeside walkway design", description: "Design pedestrian walkway connecting pavilion to existing promenade", status: "done", priority: "medium", tags: ["landscape", "architectural"], position: 3, projectId: project2.id, assigneeId: ruksana.id, dueDate: daysAgo(2), createdAt: daysAgo(12), updatedAt: daysAgo(4) },
  });

  // Project 3: Mirpur Community Center (PM: Sadia)
  const t15 = await prisma.task.create({
    data: { title: "Stakeholder requirements gathering", description: "Interview community leaders for facility requirements", status: "done", priority: "high", tags: ["management"], position: 0, projectId: project3.id, assigneeId: sadia.id, dueDate: daysAgo(7), createdAt: daysAgo(14), updatedAt: daysAgo(12) },
  });
  const t16 = await prisma.task.create({
    data: { title: "Zoning compliance check", description: "Verify site zoning permits community facility use", status: "review", priority: "high", tags: ["compliance", "legal"], position: 0, projectId: project3.id, assigneeId: kamal.id, dueDate: futureDate(3), createdAt: daysAgo(12), updatedAt: daysAgo(4) },
  });
  const t17 = await prisma.task.create({
    data: { title: "Space allocation planning", description: "Draft floor plans for library, gym, and co-working areas", status: "in_progress", priority: "medium", tags: ["architectural", "interior"], position: 0, projectId: project3.id, assigneeId: sadia.id, dueDate: futureDate(10), createdAt: daysAgo(10), updatedAt: daysAgo(1) },
  });
  const t18 = await prisma.task.create({
    data: { title: "Accessibility audit", description: "Ensure design meets accessibility standards throughout", status: "backlog", priority: "high", tags: ["compliance", "architectural"], position: 0, projectId: project3.id, assigneeId: imran.id, dueDate: futureDate(18), createdAt: daysAgo(7), updatedAt: daysAgo(7) },
  });
  const t19 = await prisma.task.create({
    data: { title: "Budget estimation", description: "Prepare detailed cost estimate for all construction phases", status: "backlog", priority: "medium", tags: ["management", "finance"], position: 1, projectId: project3.id, assigneeId: kamal.id, dueDate: futureDate(22), createdAt: daysAgo(5), updatedAt: daysAgo(5) },
  });
  const t19b = await prisma.task.create({
    data: { title: "Childcare wing layout", description: "Design safe childcare facility with outdoor play area", status: "in_progress", priority: "high", tags: ["interior", "architectural"], position: 2, projectId: project3.id, assigneeId: sadia.id, dueDate: futureDate(14), createdAt: daysAgo(6), updatedAt: daysAgo(1) },
  });
  const t19c = await prisma.task.create({
    data: { title: "Landscape & courtyard plan", description: "Design central courtyard with greenery and seating areas", status: "backlog", priority: "low", tags: ["landscape"], position: 3, projectId: project3.id, assigneeId: ruksana.id, dueDate: futureDate(28), createdAt: daysAgo(4), updatedAt: daysAgo(4) },
  });
  const t19d = await prisma.task.create({
    data: { title: "Structural feasibility study", description: "Assess soil conditions and structural viability for 3-story facility", status: "done", priority: "high", tags: ["structural", "engineering"], position: 4, projectId: project3.id, assigneeId: imran.id, dueDate: daysAgo(4), createdAt: daysAgo(13), updatedAt: daysAgo(6) },
  });

  // ── Comments ─────────────────────────────────────────────
  await prisma.comment.createMany({
    data: [
      // Gulshan Tower
      { body: "Foundation drawings look good. Minor revision needed on column spacing near the elevator core.", taskId: t1.id, authorId: rahim.id, createdAt: daysAgo(8) },
      { body: "Load analysis for floors 1-5 complete. Starting 6-10 this week. No structural concerns so far.", taskId: t2.id, authorId: fatima.id, createdAt: daysAgo(6) },
      { body: "Elevator shaft placement conflicts with the HVAC duct routing on floor 12. Need to coordinate with Tanvir.", taskId: t3.id, authorId: arif.id, createdAt: daysAgo(3) },
      { body: "Updated the parking layout to accommodate 215 vehicles. Added EV charging stations on level B1.", taskId: t4.id, authorId: arif.id, createdAt: daysAgo(1) },
      { body: "HVAC routing draft ready for floors 1-15. Will need to verify clearance above dropped ceilings.", taskId: t5.id, authorId: tanvir.id, createdAt: daysAgo(2) },
      { body: "Electrical riser needs to account for the planned solar panel installation on the roof.", taskId: t8b.id, authorId: tanvir.id, createdAt: daysAgo(1) },

      // Waterfront Pavilion
      { body: "EIA report submitted. Waiting for DoE review — typically 2-3 weeks turnaround.", taskId: t10.id, authorId: fatima.id, createdAt: daysAgo(4) },
      { body: "Acoustic modeling shows we need sound barriers on the north side to reduce traffic noise.", taskId: t11.id, authorId: rahim.id, createdAt: daysAgo(2) },
      { body: "Proposed native drought-resistant species for the green roof. Reduces irrigation needs by 40%.", taskId: t12.id, authorId: ruksana.id, createdAt: daysAgo(1) },
      { body: "Cafe kitchen needs a separate grease trap per municipal code. Updating the plumbing layout.", taskId: t14b.id, authorId: priya.id, createdAt: daysAgo(1) },
      { body: "Walkway materials finalized — permeable pavers to manage stormwater runoff near the lake.", taskId: t14c.id, authorId: ruksana.id, createdAt: daysAgo(5) },

      // Community Center
      { body: "Community leaders requested dedicated prayer room and larger library space. Updated requirements doc.", taskId: t15.id, authorId: sadia.id, createdAt: daysAgo(12) },
      { body: "Zoning is approved for community use. Need to verify height restrictions before proceeding.", taskId: t16.id, authorId: kamal.id, createdAt: daysAgo(5) },
      { body: "Soil report received. Ground conditions are favorable — standard raft foundation will work.", taskId: t19d.id, authorId: imran.id, createdAt: daysAgo(7) },
      { body: "Childcare wing needs to meet BSEC guidelines for ventilation and natural light. Adjusting window ratios.", taskId: t19b.id, authorId: sadia.id, createdAt: daysAgo(1) },
    ],
  });

  // ── Activity Feed ────────────────────────────────────────
  await prisma.activity.createMany({
    data: [
      // Project creation
      { action: "project.created", projectId: project1.id, userId: nadia.id, details: { name: "Gulshan Tower Complex" }, createdAt: daysAgo(14) },
      { action: "project.created", projectId: project2.id, userId: nadia.id, details: { name: "Dhaka Waterfront Pavilion" }, createdAt: daysAgo(14) },
      { action: "project.created", projectId: project3.id, userId: nadia.id, details: { name: "Mirpur Community Center" }, createdAt: daysAgo(14) },

      // Gulshan Tower activity (PM: Rahim)
      { action: "task.created", projectId: project1.id, taskId: t1.id, userId: rahim.id, details: { title: "Foundation blueprint review" }, createdAt: daysAgo(14) },
      { action: "task.status_changed", projectId: project1.id, taskId: t1.id, userId: rahim.id, details: { from: "in_progress", to: "done" }, createdAt: daysAgo(7) },
      { action: "task.status_changed", projectId: project1.id, taskId: t2.id, userId: fatima.id, details: { from: "review", to: "done" }, createdAt: daysAgo(5) },
      { action: "task.status_changed", projectId: project1.id, taskId: t3.id, userId: arif.id, details: { from: "in_progress", to: "review" }, createdAt: daysAgo(2) },
      { action: "comment.added", projectId: project1.id, taskId: t3.id, userId: arif.id, createdAt: daysAgo(3) },
      { action: "comment.added", projectId: project1.id, taskId: t5.id, userId: tanvir.id, createdAt: daysAgo(2) },
      { action: "comment.added", projectId: project1.id, taskId: t4.id, userId: arif.id, createdAt: daysAgo(1) },

      // Waterfront Pavilion activity (PM: Fatima)
      { action: "task.status_changed", projectId: project2.id, taskId: t9.id, userId: rahim.id, details: { from: "review", to: "done" }, createdAt: daysAgo(10) },
      { action: "task.status_changed", projectId: project2.id, taskId: t14c.id, userId: ruksana.id, details: { from: "in_progress", to: "done" }, createdAt: daysAgo(4) },
      { action: "task.status_changed", projectId: project2.id, taskId: t10.id, userId: fatima.id, details: { from: "in_progress", to: "review" }, createdAt: daysAgo(3) },
      { action: "comment.added", projectId: project2.id, taskId: t10.id, userId: fatima.id, createdAt: daysAgo(4) },
      { action: "comment.added", projectId: project2.id, taskId: t12.id, userId: ruksana.id, createdAt: daysAgo(1) },
      { action: "task.status_changed", projectId: project2.id, taskId: t12.id, userId: ruksana.id, details: { from: "backlog", to: "in_progress" }, createdAt: daysAgo(1) },

      // Community Center activity (PM: Sadia)
      { action: "task.status_changed", projectId: project3.id, taskId: t15.id, userId: sadia.id, details: { from: "in_progress", to: "done" }, createdAt: daysAgo(12) },
      { action: "task.status_changed", projectId: project3.id, taskId: t19d.id, userId: imran.id, details: { from: "in_progress", to: "done" }, createdAt: daysAgo(6) },
      { action: "task.status_changed", projectId: project3.id, taskId: t16.id, userId: kamal.id, details: { from: "in_progress", to: "review" }, createdAt: daysAgo(4) },
      { action: "task.created", projectId: project3.id, taskId: t19.id, userId: sadia.id, details: { title: "Budget estimation" }, createdAt: daysAgo(5) },
      { action: "comment.added", projectId: project3.id, taskId: t19b.id, userId: sadia.id, createdAt: daysAgo(1) },
      { action: "member.added", projectId: project3.id, userId: sadia.id, details: { memberName: "Priya Das" }, createdAt: daysAgo(3) },
    ],
  });

  console.log("Seed data created successfully!");
  console.log("  - 10 team members, 3 projects, 25 tasks");
  console.log("  - 18 project memberships, 15 comments, 22 activities");
  console.log("  - Each project has a different Project Manager");
  console.log("");
  console.log("Login credentials (all passwords: demo1234):");
  console.log("  nadia@studiodhaka.com   (Admin — Principal Architect)");
  console.log("  rahim@studiodhaka.com   (PM — Gulshan Tower)");
  console.log("  fatima@studiodhaka.com  (PM — Waterfront Pavilion)");
  console.log("  sadia@studiodhaka.com   (PM — Community Center)");
  console.log("  arif@studiodhaka.com    (Employee)");
  console.log("  tanvir@studiodhaka.com  (Employee)");
  console.log("  imran@studiodhaka.com   (Employee)");
  console.log("  ruksana@studiodhaka.com (Employee)");
  console.log("  kamal@studiodhaka.com   (Employee)");
  console.log("  priya@studiodhaka.com   (Employee)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
