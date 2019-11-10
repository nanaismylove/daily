import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

const DEFAULT_QUERY = 'react';
const DEFAULT_HPP = '5';

const PATH_BASE = 'https://hn.algolia.com/api/v1';
const PATH_SEARCH = '/search';
const PARAM_SEARCH = 'query=';
const PARAM_PAGE = 'page=';
const PARAM_HPP = 'hitsPerPage=';
fetch(`${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${DEFAULT_QUERY}&${PARAM_PAGE}${1}&${PARAM_HPP}${DEFAULT_HPP}`)
      .then(response => response.json())
      .then(result => this.setSearchTopStories(result))
      .catch(e => e);
class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      result: null,
      searchTerm: DEFAULT_QUERY,
      gorequest:false,
  };
    this.setSearchTopStories = this.setSearchTopStories.bind(this); 
    this.fetchSearchTopStories = this.fetchSearchTopStories.bind(this); 
    this.onSearchChange = this.onSearchChange.bind(this); 
    this.onSearchSubmit = this.onSearchSubmit.bind(this);
    this.onDismiss = this.onDismiss.bind(this);
  }
  
  /** fetchSearchTopStories $拉取新闻标题数据方法 
   * ES6原声fetch异步请求数据,此API功能强大。
  */
  fetchSearchTopStories(searchTerm,page=0) {
    this.setState({ gorequest: true });
    fetch(`${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${searchTerm}&${PARAM_PAGE}${page}&${PARAM_HPP}${DEFAULT_HPP}`)
      .then(response => response.json())
      .then(result => this.setSearchTopStories(result))
      .catch(e => e);
  }

  /** setSearchTopStories $拉取更多新闻标题数据方法 
   * ES6...拓展运算符号大多数情况下用来组合多个对象或者数组。
  */
  setSearchTopStories(result) {
    const { hits, page } = result;
    const oldHits = page !== 0 ? this.state.result.hits: [];
    const updatedHits = [
      ...oldHits,
      ...hits
    ];
    this.setState({
      result: { hits: updatedHits, page },
      gorequest: false 
    });
  }

  /** onDismiss $删除方法
   * 利用filter过滤数据并返回新数据                 
   * ES6...拓展运算符。
  */
  onDismiss(id){
    const isNotId = items => items.objectID !== id;
    const updatedHits = this.state.result.hits.filter(isNotId);
    this.setState({
          result:{...this.state.result, hits: updatedHits}
    })
  }
  /** onSearchChange 
   *                
  */
  onSearchChange(event){
    this.setState({ searchTerm: event.target.value });
  }
  
  onSearchSubmit(event){
    const { searchTerm } = this.state;
    this.fetchSearchTopStories(searchTerm);
    event.preventDefault();
  }

  componentDidMount() {
    const { searchTerm } = this.state;
    this.fetchSearchTopStories(searchTerm);
  }

  render() {
    
    const { searchTerm, result, gorequest } = this.state;
    const page = (result && result.page) || 0;

    return (
      <div className="page">
        <div className="interactions">
          <Search 
            value={searchTerm}
            onChange={this.onSearchChange}
            onSubmit={this.onSearchSubmit}
          >
            Search
          </Search>

          { result && <Table
              list={result.hits}
              pattern={searchTerm}
              onDismiss={this.onDismiss}
            />
          }
          
        <div className="interactions">  
          { 
            gorequest ? <Gorequest className="page"> Go request... </Gorequest>:<Button onClick={() => this.fetchSearchTopStories(searchTerm, page + 1)}>More</Button>
          }
        </div>

        </div>
      </div>
    )
      
      
} }

class Search extends Component{
  render(){
    const { value, onChange, onSubmit, children } = this.props;
    return (
      <form onSubmit={onSubmit}>
        {children}{' '}
        <input
          type='text'
          value={value}
          onChange={onChange}
        />
        <button type="submit">
          {children}
        </button>
      </form>  
    );
  }
}


const largeColumn = { 
        width: '50%',
      };
const midColumn = {
        width: '10%',
      };
const smallColumn = {
        width: '10%',
      };
/** isSearched 
 *   一个用来查找过滤高阶函数结合filter使用          
*/
const isSearched = searchTerm => items => items.title.toLowerCase().includes(searchTerm.toLowerCase());

const Table = ({ list, pattern, onDismiss })=>{

  return (
    <div className='table'>
      {list.map(item =>
        <div key={item.objectID} className='table-row'>
          <span style={largeColumn}>
            <a href={item.url}>{item.title}</a>
          </span>
          <span style={smallColumn}>{item.author}</span>
          <span style={smallColumn}>{item.num_comments}</span>
          <span style={smallColumn}>{item.points}</span>
          <span>
            <Button
              onClick={() => onDismiss(item.objectID)}
              className='button-inline'
            >
              Dismiss
            </Button>
          </span>  
        </div>    
      )}
    </div>  
  )
}


const Button = ({onClick, className, children}) => {
    return (
      <button
        onClick={onClick}
        className={className}
        type="button" 
      >
        {children}
      </button>
    )
}

const Gorequest = ({className, children}) => {
  return (
    <b className={className} >
      {children}
    </b>
  )
}

export default App;
