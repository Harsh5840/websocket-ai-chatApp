import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/middleware';

const roomRouter = express.Router();
const prisma = new PrismaClient();

// GET /room/:name - e.g. room-DevGPT
roomRouter.get("/" , authMiddleware,async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        assistant: true,
      },
    });
    res.json(rooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load rooms' });
  }
});


roomRouter.get('/:name',authMiddleware, async (req, res) => {
  try {
    const { name } = req.params;

    const room = await prisma.room.findFirst({
      where: { name },
      include: {
        assistant: true,
        chats: {
          include: { user: true },
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json(room);
  } catch (err) {
    console.error('Room fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /room/:name/chat
roomRouter.post('/:name/chat',authMiddleware, async (req, res) => {
  const { message, userId } = req.body;

  const room = await prisma.room.findFirst({ where: { name: req.params.name } });
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const newChat = await prisma.chat.create({
    data: {
      message,
      userId,
      roomId: room.id,
    },
  });

  res.json(newChat);
});

export default roomRouter;
