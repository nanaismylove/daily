/* eslint-disable */
import fetch from 'dva/fetch';
import { notification, message } from 'antd';
import { routerRedux } from 'dva/router';
import globalConfig from '../common/config.js';
import superagent from 'superagent';
import store from '../index';
import Cookies from 'js-cookie';

const codeMessage = {
  200: '服务器成功返回请求的数据。',
  201: '新建或修改数据成功。',
  202: '一个请求已经进入后台排队（异步任务）。',
  204: '删除数据成功。',
  400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
  401: '用户没有权限（令牌、用户名、密码错误）。',
  403: '用户得到授权，但是访问是被禁止的。',
  404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
  406: '请求的格式不可得。',
  410: '请求的资源被永久删除，且不会再得到的。',
  422: '当创建一个对象时，发生一个验证错误。',
  500: '服务器发生错误，请检查服务器。',
  502: '网关错误。',
  503: '服务不可用，服务器暂时过载或维护。',
  504: '网关超时。',
};
function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }
  const errortext = codeMessage[response.status] || response.statusText;
  notification.error({
    message: `请求错误 ${response.status}: ${response.error.url}`,
    description: errortext,
  });
  const error = new Error(errortext);
  error.name = response.status;
  error.response = response;
  throw error;
}

/**
 * 内部方法, 在superagent api的基础上, 包装一些全局的设置
 *
 * @param method 要请求的方法
 * @param url 要请求的url
 * @param params url上的额外参数
 * @param data 要发送的数据
 * @param headers 额外设置的http header
 * @returns {Promise}
 */
export function request(url, { method, body } = {}) {
  // 转译代码
  // body = EscapedContent(body);

  if (window.Cookname) {
    if (Cookies.get('site_name') !== window.Cookname) {
      window.Cookname = '';
      message.warning('您的站点已切换，当前页面即将刷新.');
      setTimeout(function() {
        window.location.reload();
      }, 1500);
    }
  }

  return new Promise((resolve, reject) => {
    const siteId = Cookies.get('site_codes');
    // console.log(Cookies.get('site_code'))
    // 默认采用GET请求数据
    const defaultMethod = method || 'GET';
    // url === '/data/goods/options' || url === '/data/goods/select'
    //   ? (globalConfig.api.host = 'http://jadmins.orderplus.com')
    //   : (globalConfig.api.host = 'http://jadmins.beta.orderplus.com');
    const tmp = superagent(defaultMethod, globalConfig.api.host + url);
    // 是否是跨域请求
    tmp.withCredentials();

    // 设置全局的超时时间
    if (globalConfig.api.timeout && !isNaN(globalConfig.api.timeout)) {
      tmp.timeout(globalConfig.api.timeout);
    }

    // 默认的Content-Type和Accept
    tmp.set('Content-Type', 'application/json');
    tmp.set('Accept', 'application/json');
    tmp.set('Site-Id', siteId);

    // 设置时间戳
    tmp.query({ _timestamp: new Date().getTime() });

    // body中发送的数据
    if (body) {
      tmp.send(body);
    }
    // 包装成promise
    tmp.end((err, res) => {
      const filterUrl = ['/userinfo', '/login', '/logout'];
      if (res && res.body) {
        resolve(JSON.parse(JSON.stringify(res.body)));
        if (!filterUrl.includes(url)) {
          if (res.body.code !== 1) {
            notification.error({
              message: '出错啦!',
              description: `错误信息: ${res.body.msg}`,
            });
            return;
          }
        }
      } else if (res && res.status) {
        const { dispatch } = store;
        const status = res.status;
        if (status === 400) {
          notification.error({
            message: '网络请求错误',
            description: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
          });
          return;
        }
        if (status === 401) {
          dispatch({
            type: 'login/logout',
          });
          return;
        }
        if (status === 403) {
          dispatch(routerRedux.push('/exception/403'));
          return;
        }
        if (status <= 504 && status >= 500) {
          dispatch(routerRedux.push('/exception/500'));
          return;
        }
        if (status >= 404 && status < 422) {
          dispatch(routerRedux.push('/exception/404'));
        }
      } else {
        notification.error({
          message: '网络请求错误',
          description: `${err.message}`,
        });
        reject(err || res);
      }
    });
  });
}

/**
 * Requests a URL, returning a promise.
 *
 * @param  {string} url       The URL we want to request
 * @param  {object} [options] The options we want to pass to "fetch"
 * @return {object}           An object containing either "data" or "err"
 */
export function getmock(url, options) {
  const defaultOptions = {
    credentials: 'include',
  };
  const newOptions = { ...defaultOptions, ...options };
  if (newOptions.method === 'POST' || newOptions.method === 'PUT') {
    if (!(newOptions.body instanceof FormData)) {
      newOptions.headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json; charset=utf-8',
        ...newOptions.headers,
      };
      newOptions.body = JSON.stringify(newOptions.body);
    } else {
      // newOptions.body is FormData
      newOptions.headers = {
        Accept: 'application/json',
        'Content-Type': 'multipart/form-data',
        ...newOptions.headers,
      };
    }
  }

  return fetch(url, newOptions)
    .then(checkStatus)
    .then(response => {
      if (newOptions.method === 'DELETE' || response.status === 204) {
        return response.text();
      }
      return response.json();
    })
    .catch(e => {
      const { dispatch } = store;
      const status = e.name;
    });
}
