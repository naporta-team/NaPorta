import fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import z from "zod";
import { prisma } from "./lib/prisma";
import { compare, hash } from "bcryptjs";
import cors from "@fastify/cors";
import { env } from "./env";
import jwt from "@fastify/jwt";

export const app = fastify();

app.register(
  cors, 
  { 
    origin: "*",
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'], 
  },
);

app.register(
  jwt, 
  { 
    secret: env.JWT_SECRET 
  }
);

const getAuthenticateSchemaBody = z.object({
  email: z.email(),
  password: z.string().min(4),
});

app.post("/sessions", async (req: FastifyRequest, reply: FastifyReply) => {
  const { email, password } = getAuthenticateSchemaBody.parse(req.body);

  const emailToLowerCase = email.trim().toLowerCase();
  
  const user = await prisma.user.findUnique({
    where: {
      email: emailToLowerCase,
    },
  });

  if (!user) {
    return reply.status(400).send({ error: "Invalid credentials error." });
  }

  const doesPasswordMatches = await compare(password, user.password_hash);

  if (!doesPasswordMatches) {
    return reply.status(400).send({ error: "Invalid credentials error." });
  }

  try {
    const token = await reply.jwtSign(
      {
        name: user.name
      },
      {
        sign: {
          sub: user.id,
          // expiresIn: "1d",
        },
      },
    );

    return reply.status(200).send({
      token,
    });
  } catch (err) {
    console.error("Houve um problema no cadastro do usuário: ", err);
  }
});

const getUserSchemaRequest = z.object({
  query: z.string().optional(),
  page: z.number().optional().default(1),
});

app.get("/users", async (req: FastifyRequest, reply: FastifyReply) => {
  const { query, page } = getUserSchemaRequest.parse(req.query);

  try {
    const users = await prisma.user.findMany({
      where: {
        name: {
          contains: query ? query : "",
        },
      },
      take: 20,
      skip: (page - 1) * 20,
    });

    return reply.status(200).send(users);
  } catch (err) {
    console.error("Error: ", err);
  }
});

const createUserSchemaRequest = z.object({
  name: z.string().min(1),
  email: z.email(),
  password: z.string().min(6),
  // rules: z.array(z.enum(["admin", "user"])).default(["user"]),
});

app.post("/users", async (req: FastifyRequest, reply: FastifyReply) => {
  const { name, email, password } = createUserSchemaRequest.parse(req.body);

  const emailToLowerCase = email.trim().toLowerCase();
  const emailAlredyExists = await prisma.user.findUnique({
    where: {
      email: emailToLowerCase,
    },
  });

  if (emailAlredyExists) {
    return reply.status(400).send({ error: "Email already exists." });
  }

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email: emailToLowerCase,
        password_hash: await hash(password, 6),
      },
    });

    return reply.status(201).send(user);
  } catch (err) {
    console.error("Houve um problema no cadastro do usuário: ", err);
  }
});

app.get("/rooms", async (req: FastifyRequest, reply: FastifyReply) => {
  const rooms = await prisma.room.findMany();
  return reply.status(200).send(rooms);
});

const createRoomSchema = z.object({
  number: z.string().min(1),
});

app.post("/rooms", async (req: FastifyRequest, reply: FastifyReply) => {
  const { number } = createRoomSchema.parse(req.body);

  const roomAlreadyExists = await prisma.room.findUnique({ where: { number } });

  if (roomAlreadyExists) {
    return reply.status(400).send({ error: "Room already exists." });
  }

  try {
    const room = await prisma.room.create({ data: { number } });

    return reply.status(201).send(room);
  } catch (err) {
    console.error(err);
  }
});

app.get("/guests", async (req: FastifyRequest, reply: FastifyReply) => {
  const guests = await prisma.guest.findMany({
    include: {
      room: true,
    },
  });

  return reply.status(200).send(guests);
});

app.get("/guests/:token", async (req: FastifyRequest, reply: FastifyReply) => {
  const { token } = req.params as { token: string };

  const guest = await prisma.guest.findUnique({
    where: { token },
    include: { room: true },
  });

  if (!guest || !guest.active)
    return reply.status(404).send({ error: "Guest not found." });

  return reply.status(200).send(guest);
});

const createGuestSchema = z.object({
  name: z.string().min(1),
  room_id: z.uuid(),
});

app.post("/guests", async (req: FastifyRequest, reply: FastifyReply) => {
  const { name, room_id } = createGuestSchema.parse(req.body);

  try {
    const guest = await prisma.guest.create({
      data: {
        name,
        room_id,
      },
    });

    return reply.status(201).send(guest);
  } catch (err) {
    console.error(err);
  }
});

app.patch(
  "/guests/:id/checkout",
  async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };

    const guest = await prisma.guest.update({
      where: { id },
      data: { active: false },
    });

    return reply.status(200).send(guest);
  },
);

app.get("/menu", async (req: FastifyRequest, reply: FastifyReply) => {
  const { category } = req.query as { category?: string };

  const items = await prisma.menuItem.findMany({
    where: {
      available: true,
      ...(category ? { category: category as any } : {}),
    },
  });

  return reply.status(200).send(items);
});

const createMenuItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  image_url: z.url().optional(),
  category: z.enum(["breakfast", "lunch", "dinner", "drinks", "snacks"]),
});

app.post("/menu", async (req: FastifyRequest, reply: FastifyReply) => {
  const { name, description, price, image_url, category } =
    createMenuItemSchema.parse(req.body);

  try {
    // const img_url = image_url ? image_url :
    const item = await prisma.menuItem.create({
      data: {
        name,
        description: description ? description : "",
        price,
        image_url: image_url ? image_url : "",
        category,
        available: true,
      },
    });
    return reply.status(201).send(item);
  } catch (err) {
    console.error(err);
  }
});

const updateMenuItemSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  price: z.number().positive().optional(),
  image_url: z.string().url().nullable().optional(),
  category: z
    .enum(["breakfast", "lunch", "dinner", "drinks", "snacks"])
    .optional(),
  available: z.boolean().optional(),
});

app.patch("/menu/:id", async (req: FastifyRequest, reply: FastifyReply) => {
  const { id } = req.params as { id: string };
  const data = updateMenuItemSchema.parse(req.body);

  const item = await prisma.menuItem.update({ where: { id }, data });
  return reply.status(200).send(item);
});

const createOrderSchema = z.object({
  guest_id: z.uuid(),
  items: z
    .array(
      z.object({
        menu_item_id: z.uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

app.get('/menu/all', async (req: FastifyRequest, reply: FastifyReply) => {
  const items = await prisma.menuItem.findMany();
  return reply.status(200).send(items);
});

app.get(
  "/orders/:guest_id",
  async (req: FastifyRequest, reply: FastifyReply) => {
    const { guest_id } = req.params as { guest_id: string };

    const orders = await prisma.order.findMany({
      where: { guest_id },
      include: { items: { include: { menu_item: true } } },
      orderBy: { created_at: "desc" },
    });

    return reply.status(200).send(orders);
  },
);

app.post("/orders", async (req: FastifyRequest, reply: FastifyReply) => {
  const { guest_id, items } = createOrderSchema.parse(req.body);

  const activeOrder = await prisma.order.findFirst({
    where: { guest_id, status: { in: ["pending", "preparing"] } },
  });

  if (activeOrder)
    return reply
      .status(400)
      .send({ error: "Guest already has an active order." });

  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: items.map((i) => i.menu_item_id) } },
  });

  try {
    const order = await prisma.order.create({
      data: {
        guest_id,
        items: {
          create: items.map((i) => ({
            menu_item_id: i.menu_item_id,
            quantity: i.quantity,
            price: menuItems.find((m) => m.id === i.menu_item_id)!.price,
          })),
        },
      },
      include: { items: { include: { menu_item: true } } },
    });

    return reply.status(201).send(order);
  } catch (err) {
    console.error(err);
  }
});

app.patch(
  "/orders/:id/status",
  async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const { status } = z
      .object({
        status: z.enum(["pending", "preparing", "delivered", "cancelled"]),
      })
      .parse(req.body);

    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });
    return reply.status(200).send(order);
  },
);

app.get('/orders', async (req: FastifyRequest, reply: FastifyReply) => {
  const orders = await prisma.order.findMany({
    include: {
      guest: { include: { room: true } },
      items: { include: { menu_item: true } },
    },
    orderBy: { created_at: 'desc' },
  });

  return reply.status(200).send(orders);
});
