import dotenv from "dotenv";
import { eq } from "drizzle-orm";
import { hashPassword } from "../lib/auth/session";
import { db } from "../lib/db/drizzle";
import { memories, teamMembers, teams, users } from "../lib/db/schema";

dotenv.config();

async function seed() {
  const email = "olserra@gmail.com";

  let userRes = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  let user;
  if (userRes.length === 0) {
    console.log("User not found, creating user", email);
    const passwordHash = await hashPassword("changeme");
    const [created] = await db
      .insert(users)
      .values({
        name: "Otávio",
        email,
        passwordHash,
        role: "member",
      })
      .returning();
    user = created;
  } else {
    user = userRes[0];
  }

  // find or create a team for the user
  const tm = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.userId, user.id))
    .limit(1);
  let teamId;
  if (tm.length === 0) {
    console.log("Creating team for user");
    const [team] = await db
      .insert(teams)
      .values({ name: "Personal" })
      .returning();
    teamId = team.id;
    await db
      .insert(teamMembers)
      .values({ teamId, userId: user.id, role: "owner" });
  } else {
    teamId = tm[0].teamId;
  }

  const raw = `Is considering upgrading their AI knowledge and is evaluating different learning paths, including high-level technical courses at MIT, an MBA in Brazil, and free online content from platforms like DeepLearning.ai and Stanford. User has hands-on experience with projects like xmem but finds some complexity challenging. They are exploring the best learning methods and the right level of technical depth needed in AI.

Is interested in both the strategic and technical aspects of AI. They want to understand AI architectures, model analysis, and observability, and are considering a technical MBA from Full Cycle in Software Engineering with AI. User wants to find a balance between strategic knowledge and technical depth to stand out in the field.

Has considered replicating the Full Cycle MBA content using free online resources and values the flexibility of self-directed learning. They are skeptical about paying for structured programs when similar content and support can be accessed for free, including with the help of ChatGPT.

Wants to create a detailed AI learning roadmap, covering topics such as LLM and Transformer fundamentals, prompt engineering, fine-tuning and alignment, retrieval-augmented generation, agentic AI and MCP servers, risks and integrity, MLOps and LLMOps, and scaling Gen AI products. They are interested in having focused, short discussions on each topic to deepen their understanding.

Is reading 'AI Value Creators' by O'Reilly but finds it challenging to read at night due to fatigue. They prefer learning through conversations and find it more efficient and comfortable. They are concerned about not reading enough and whether it might affect their cognitive development.

Is planning to schedule a one-on-one conversation with the CIO of Duvenbeck to discuss which course to pursue. They already have a strong background in technology but not as much in AI, so they consider the 10-week technical course (around 3,000 euros) a good initial choice. However, they are now considering that the course may not be worth the investment, as much of the content is pre-recorded and there are many high-quality free resources available, such as Stanford and Harvard lectures on YouTube. They are thinking about investing the money in more strategic and high-impact courses, like those from MIT and Harvard, and using free resources and ChatGPT to create a technical roadmap if needed.

Requested a study roadmap focused on strategic and regulatory topics, such as the European Union AI Act, Data Act, and Data Strategy, considering high-quality free resources like Stanford lectures on YouTube. They want to identify which technical content is essential and which strategic courses, possibly in-person, could truly boost their career, such as those from Harvard, MIT, or INSEAD.

Is interested in a strategic decision-making cheat sheet for AI tools, including platforms like Dify, Flowise, n8n, LangGraph, CrewAI, Noxus.ai, and Autogen, and wants to track other relevant players for evaluating tools by abstraction level and use case fit.

O nome do usuário é Otávio e ele tem dois filhos: Antônio, nascido em 15 de outubro de 2018, e Benjamin, nascido em 3 de setembro de 2021, com 3 anos.

Was born on 11 July 1981 in Rio de Janeiro, at Hospital São José at 1:30 PM.

Father is Adherbal de Andrade Serra, born in Rio de Janeiro on 22 May 1950.

Mother is Gloria Maria de Vasconcellos Levier Serra, born in Rio de Janeiro on 18 October 1954.

Height is 1.83 meters.

At Duvenbeck, user reports to Jakub (CIO), and also to Hugo and Michael from DLX, an intermediary company.

Is developing an MVP for a 'Distributed Multi-Agent Collaboration Network' for logistics, where autonomous agents represent nodes like factories, ports, and carriers. Each agent makes local decisions, communicates status updates, and contributes to global coherence. MVP will initially skip blockchain and use hardcoded placeholders.

Is more interested in research about AI Governance and Architectures that ensure agents and systems are safe, efficient, and lean.

Currently weighs 78kg.

Usuário deseja ser avisado quando abrirem concursos para a Autoridade Tributária e Aduaneira (AT), especialmente para a carreira de Gestor Tributário e Aduaneiro (GITA). Deseja ser notificado sobre avisos de abertura e início de candidaturas.

Usuário gosta de pensar em como a interação homem-máquina, especialmente com agentes de IA, pode ajudar a tornar o ser humano mais capaz e potente, focando em estratégias e memória.

Wants LinkedIn posts to follow this format:

1. Use 3–5 strategic hashtags (mix of broad and niche, avoid generic ones).
2. Use 1–3 emojis per post for visual appeal, ideally in the first line or to break up text.
3. End with an open-ended question to encourage engagement.
4. Keep posts 1,200–1,600 characters.
5. Ideal post times: Tues–Thurs, 8–10 AM or 12–2 PM.
6. Use multimedia and tag relevant people only if it adds value.

Avoid too many hashtags, generic ones, or yes/no questions.

Is creating many LinkedIn posts using AI, typically merging information from multiple articles. They also send interesting LinkedIn posts to their personal WhatsApp as a 'to-do' list and want to better organize them using free tools.

Usuário vai fazer uma demo do xmem em breve e precisa de ajuda para preparar.

Usuário demonstrou muito interesse em atuar como AI Engineer com foco em LLMs e automações. Está especialmente interessado em aprender sobre integração de LLMs e ferramentas como n8n.

Is using Cursor as their code editor.

Coloque-as separadamente, conforme a quebra de linha.

Sugere, para tal finalidade, colocar numa vector db ou no postgres?
`;

  const parts = raw
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean);

  for (const p of parts) {
    const title = p.split("\n")[0].slice(0, 200);
    await db.insert(memories).values({
      teamId,
      userId: user.id,
      title,
      content: p,
      tags: JSON.stringify([]),
    });
  }

  console.log("Seeded", parts.length, "memories for", email);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
