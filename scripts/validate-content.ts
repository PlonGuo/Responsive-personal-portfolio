import { validateDictionaries, getDictionary } from '../lib/i18n/dictionaries';
import { validatePortfolioContent } from '../lib/content/projects';
import { validateBlogContent } from '../lib/content/posts';

validateDictionaries(getDictionary('en'), getDictionary('zh'));
validatePortfolioContent();
validateBlogContent();
console.log('Both dictionaries, portfolio content and blog manifest are complete.');
