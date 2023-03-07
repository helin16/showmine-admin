type IResList<T> = {
  'from': number,
  to: number,
  per_page: number, // eslint-disable-line
  total: number,

  current_page: number, // eslint-disable-line
  last_page: number, // eslint-disable-line

  // first_page_url: string,
  // last_page_url: string,
  // next_page_url: string,
  // prev_page_url: string | null,

  // path: string,

  data: T[],
}

export const InitialList = {
  from: 0,
  to: 0,
  per_page: 0, // eslint-disable-line
  total: 0,
  current_page: 0, // eslint-disable-line
  last_page: 0, // eslint-disable-line
  data: [],
};

export default IResList;
