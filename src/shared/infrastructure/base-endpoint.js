/**
 * Reusable endpoint client with CRUD operations over a resource collection.
 *
 * @class BaseEndpoint
 */
export class BaseEndpoint {
  /**
   * @param {import('./base-api.js').BaseApi} baseApi - Configured API client owner.
   * @param {string} endpointPath - Relative resource path.
   */
  constructor(baseApi, endpointPath) {
    this.http = baseApi.http;
    this.endpointPath = endpointPath;
  }

  /**
   * @param {Object} [params={}] - Query parameters used to filter the collection.
   * @returns {Promise<import('axios').AxiosResponse>} HTTP response with resource collection.
   */
  getAll(params = {}) {
    return this.http.get(this.endpointPath, { params });
  }

  /**
   * @param {string|number} id - Resource identifier.
   * @returns {Promise<import('axios').AxiosResponse>} HTTP response with one resource.
   */
  getById(id) {
    return this.http.get(`${this.endpointPath}/${id}`);
  }

  /**
   * @param {Object} resource - Resource payload to create.
   * @returns {Promise<import('axios').AxiosResponse>} HTTP response with created resource.
   */
  create(resource) {
    return this.http.post(this.endpointPath, resource);
  }

  /**
   * @param {string|number} id - Resource identifier.
   * @param {Object} resource - Resource payload to update.
   * @returns {Promise<import('axios').AxiosResponse>} HTTP response with updated resource.
   */
  update(id, resource) {
    return this.http.put(`${this.endpointPath}/${id}`, resource);
  }

  /**
   * @param {string|number} id - Resource identifier.
   * @returns {Promise<import('axios').AxiosResponse>} HTTP response for delete operation.
   */
  delete(id) {
    return this.http.delete(`${this.endpointPath}/${id}`);
  }
}
