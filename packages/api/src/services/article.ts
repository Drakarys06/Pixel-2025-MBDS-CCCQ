interface Article {
	id: number;
	title: string;
	content: string;
	date: string;
  }
  
  interface ArticleInput {
	id: number;
	title: string;
	content: string;
  }
  
  export const articles: Article[] = [
	{
	  id: 1,
	  title: 'Article 1',
	  content: 'Lorem ipsum',
	  date: (new Date()).toISOString(),
	},
	{
	  id: 2,
	  title: 'Article 2',
	  content: 'Lorem ipsum',
	  date: (new Date()).toISOString(),
	},
	{
	  id: 3,
	  title: 'Article 3',
	  content: 'Lorem ipsum',
	  date: (new Date()).toISOString(),
	},
	{
	  id: 4,
	  title: 'Article 4',
	  content: 'Lorem ipsum',
	  date: (new Date()).toISOString(),
	},
  ];
  
  export const save = (article: ArticleInput): Article[] => {
	articles.push({ ...article, date: (new Date()).toISOString() });
	return articles;
  };