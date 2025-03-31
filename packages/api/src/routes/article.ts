import express, { Request, Response } from 'express';
import * as articleService from '../services/article';

const router = express.Router();

router.get('/', (_req: Request, res: Response) => {
    res.json(articleService.articles);
});

router.post('/', (req: Request, res: Response) => {
    const { body } = req;
    console.log(`body ==> ${body}`);
    const articles = articleService.save(body);
    res.json(articles);
});

export const articleAPI = router;