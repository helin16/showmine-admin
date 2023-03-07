interface ICompanyAuthor {
  author: string,
  authorLink: string,
  id?: string,
}

export const initialCompanyAuthor: ICompanyAuthor = {
  author: '',
  authorLink: '',
};

export default ICompanyAuthor;
