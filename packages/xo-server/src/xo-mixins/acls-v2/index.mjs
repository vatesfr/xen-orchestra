// @ts-check

import keyBy from 'lodash/keyBy.js'
import isEqual from 'lodash/isEqual.js'
import { forbiddenOperation, noSuchObject, objectAlreadyExists } from 'xo-common/api-errors.js'

import { REAL_ONLY_ALL, VMS_CREATOR, VMS_POWER_STATE_MANAGER, VMS_READ_ONLY } from './template-roles.mjs'

import { Roles } from '../../models/acls-v2/role.mjs'
import { Privileges } from '../../models/acls-v2/privilege.mjs'
import { UserRoles } from '../../models/acls-v2/user-role.mjs'
import { GroupRoles } from '../../models/acls-v2/group-role.mjs'

/**
 * @typedef {import('@xen-orchestra/acl').Role} Role
 * @typedef {import('@xen-orchestra/acl').SupportedResource} SupportedResource
 * @typedef {import('@xen-orchestra/acl').Privilege<SupportedResource>} Privilege
 * @typedef {import('@vates/types').XoUser} XoUser
 * @typedef {import('@vates/types').XoGroup} XoGroup
 * @typedef {{
 *  roleTemplateId: number,
 *  name: Role['name'],
 *  description: Role['description'],
 *  privileges: {
 *    action: Privilege['action'],
 *    resource: Privilege['resource'],
 *    effect: Privilege['effect'],
 *    selector?: Privilege['selector']
 *  }[]
 * }} RoleTemplate
 *
 * @typedef {{
 *  id: string,
 *  roleId: Role['id'],
 *  userId: XoUser['id']
 * }} UserRole
 *
 * @typedef {{
 * id: string,
 * roleId: Role['id'],
 * groupId: XoGroup['id']
 * }} GroupRole
 */

/**
 * @type {RoleTemplate[]}
 */
const TEMPLATE_ROLES = [
  /** @type {RoleTemplate} */ (REAL_ONLY_ALL),
  /** @type {RoleTemplate} */ (VMS_POWER_STATE_MANAGER),
  /** @type {RoleTemplate} */ (VMS_CREATOR),
  /** @type {RoleTemplate} */ (VMS_READ_ONLY),
]

export default class {
  /**
   * @type {Roles}
   */
  // @ts-ignore initialized in core-started
  #roleDb

  /**
   * @type {Privileges}
   */
  // @ts-ignore initialized in core-started
  #privilegeDb

  /**
   * @type {UserRoles}
   */
  // @ts-ignore initialized in core-started
  #userRoleDb

  /**
   * @type {GroupRoles}
   */
  // @ts-ignore initialized in core-started
  #groupRoleDb

  /**
   *  Use XoApp from @vates/types when available
   * @param {any} app
   */
  constructor(app) {
    this._app = app

    app.hooks.on('core started', () => {
      const roleDb = new Roles({
        connection: app._redis,
        namespace: 'acl-v2-role',
      })
      this.#roleDb = roleDb

      const privilegeDb = new Privileges({
        connection: app._redis,
        namespace: 'acl-v2-privilege',
        // @ts-ignore indexes typed as never[]
        indexes: ['roleId'],
      })
      this.#privilegeDb = privilegeDb

      const userRoleDb = new UserRoles({
        connection: app._redis,
        namespace: 'acl-v2-user-role',
        // @ts-ignore indexes typed as never[]
        indexes: ['userId', 'roleId'],
      })
      this.#userRoleDb = userRoleDb

      const groupRoleDb = new GroupRoles({
        connection: app._redis,
        namespace: 'acl-v2-group-role',
        // @ts-ignore indexes typed as never[]
        indexes: ['groupId', 'roleId'],
      })
      this.#groupRoleDb = groupRoleDb

      app.addConfigManager(
        'roles',
        () => roleDb.get(),
        (/** @type {Role[]} */ roles) => roleDb.update(roles)
      )

      app.addConfigManager(
        'privileges',
        () => privilegeDb.get(),
        (/** @type {Privilege[]} */ privileges) => privilegeDb.update(privileges),
        ['roles']
      )

      app.addConfigManager(
        'userRole',
        () => userRoleDb.get(),
        (/** @type {UserRole[]} */ userRoles) => userRoleDb.update(userRoles),
        ['users', 'roles']
      )

      app.addConfigManager(
        'groupRole',
        () => groupRoleDb.get(),
        (/** @type {GroupRole[]} */ groupRoles) => groupRoleDb.update(groupRoles),
        ['groups', 'roles']
      )
    })

    app.hooks.on('clean', () =>
      Promise.all([
        this.#roleDb.rebuildIndexes(),
        this.#privilegeDb.rebuildIndexes(),
        this.#userRoleDb.rebuildIndexes(),
        this.#groupRoleDb.rebuildIndexes(),
      ])
    )

    app.hooks.on('start', () => this.#createDefaultConfiguration())
  }

  /**
   * Setup template role with their privileges
   */
  async #createDefaultConfiguration() {
    const templateRoleByRoleTemplateId = keyBy(
      (await this.getAclV2Roles()).filter(role => 'isTemplate' in role),
      'roleTemplateId'
    )

    // Remove template roles of the DB, if it doesn't exist anymore in TEMPLATE_ROLES
    for (const roleTemplateId in templateRoleByRoleTemplateId) {
      const dbRole = templateRoleByRoleTemplateId[roleTemplateId]

      if (!TEMPLATE_ROLES.some(templateRole => templateRole.roleTemplateId === dbRole.roleTemplateId)) {
        await this.deleteAclV2Role(dbRole.id, { force: true })
      }
    }

    await Promise.all(
      TEMPLATE_ROLES.map(async ({ privileges, roleTemplateId, ...props }) => {
        const templateRole = templateRoleByRoleTemplateId[roleTemplateId]

        if (templateRole === undefined) {
          const role = await this.#createAclV2TemplateRole({ ...props, roleTemplateId })
          await Promise.all(
            privileges.map(privilege => this.createAclV2Privilege({ ...privilege, roleId: role.id }, { force: true }))
          )
        } else {
          const role = await this.updateAclV2Role(templateRole.id, props, { force: true })
          const dbRolePrivileges = await this.getAclV2RolePrivileges(role.id)

          const dbPrivilegesToDelete = dbRolePrivileges.filter(
            ({ id, roleId, ...dbPrivilege }) => !privileges.some(privilege => isEqual(privilege, dbPrivilege))
          )
          const privilegesToCreate = privileges.filter(
            privilege => !dbRolePrivileges.some(({ id, roleId, ...dbPrivilege }) => isEqual(privilege, dbPrivilege))
          )

          await Promise.all(
            privilegesToCreate.map(privilege =>
              this.createAclV2Privilege({ ...privilege, roleId: role.id }, { force: true })
            )
          )

          await Promise.all(
            dbPrivilegesToDelete.map(dbPrivilege => this.deleteAclV2Privilege(dbPrivilege.id, { force: true }))
          )
        }
      })
    )
  }

  // === Role
  /**
   * @param {object} role
   * @param {Role['name']} role.name
   * @param {Role['description']} role.description
   * @param {number} role.roleTemplateId
   * @returns  {Promise<Role>}
   */
  #createAclV2TemplateRole(role) {
    return this.#roleDb.add({ ...role, isTemplate: true })
  }

  /**
   * @param {object} role
   * @param {Role['name']} role.name
   * @param {Role['description']} [role.description]
   * @returns {Promise<Role>}
   */
  createAclV2Role(role) {
    return this.#roleDb.add(role)
  }

  /**
   * @param {Role['id']} id
   * @param {object} [opts]
   * @param {boolean} [opts.force]
   * @returns {Promise<boolean>}
   */
  async deleteAclV2Role(id, { force = false } = {}) {
    const role = await this.getAclV2Role(id)

    if (!force && 'isTemplate' in role) {
      throw forbiddenOperation('delete ACL V2 role', 'role is a template')
    }

    /** @type {UserRole[]} */
    const userRoles = await this.#userRoleDb._get({ roleId: role.id })
    await Promise.all(userRoles.map(userRole => this.deleteAclV2UserRole(userRole.userId, userRole.roleId)))

    /** @type {GroupRole[]} */
    const groupRoles = await this.#groupRoleDb._get({ roleId: role.id })
    await Promise.all(groupRoles.map(groupRole => this.deleteAclV2GroupRole(groupRole.groupId, groupRole.roleId)))

    const privileges = await this.getAclV2RolePrivileges(role.id)
    await Promise.all(privileges.map(privilege => this.deleteAclV2Privilege(privilege.id, { force })))

    return this.#roleDb.remove(role.id)
  }

  /**
   * @param {Role['id']} id
   * @param {object} role
   * @param {Role['name']} [role.name]
   * @param {Role['description'] | null} [role.description]
   * @param {object} [opts]
   * @param {boolean} [opts.force]
   *
   * @returns {Promise<Role>}
   */
  async updateAclV2Role(id, { name, description }, { force = false } = {}) {
    const role = await this.getAclV2Role(id)
    if (!force && 'isTemplate' in role) {
      throw forbiddenOperation('update ACL V2 role', 'role is a template')
    }
    if (name !== undefined) {
      role.name = name
    }

    if (description !== undefined) {
      if (description === null) {
        delete role.description
      } else {
        role.description = description
      }
    }

    return this.#roleDb.update(role)
  }

  /**
   * @param {Role['id']} id
   * @returns {Promise<Role>}
   */
  async getAclV2Role(id) {
    const role = await this.#roleDb.first(id)
    if (role === undefined) {
      throw noSuchObject(id, 'role')
    }

    return role
  }

  /**
   * @returns {Promise<Role[]>}
   */
  getAclV2Roles() {
    // @ts-ignore typed as Promise<void>...
    return this.#roleDb.get()
  }
  // === Role
  // === Privilege
  /**
   * @param {object} privilege
   * @param {Privilege['action']} privilege.action
   * @param {Privilege['selector']} [privilege.selector]
   * @param {Privilege['effect']} privilege.effect
   * @param {Privilege['resource']} privilege.resource
   * @param {Privilege['roleId']} privilege.roleId
   * @param {object} [opts]
   * @param {boolean} [opts.force]
   *
   * @returns {Promise<Privilege>}
   */
  async createAclV2Privilege({ action, selector, effect = 'allow', resource, roleId }, { force = false } = {}) {
    const role = await this.getAclV2Role(roleId)
    if (!force && 'isTemplate' in role) {
      throw forbiddenOperation('create ACL V2 privilege', 'role is a template')
    }

    return this.#privilegeDb.add({ action, selector, effect, resource, roleId })
  }

  /**
   * @param {Privilege['id']} id
   * @param {object} [opts]
   * @param {boolean} [opts.force]
   *
   * @returns {Promise<boolean>}
   */
  async deleteAclV2Privilege(id, { force = false } = {}) {
    const privilege = await this.getAclV2Privilege(id)
    const role = await this.getAclV2Role(privilege.roleId)

    if (!force && 'isTemplate' in role) {
      throw forbiddenOperation('delete ACL V2 privilege', 'role is a template')
    }

    return this.#privilegeDb.remove(privilege.id)
  }

  /**
   * @param {Privilege['id']} id
   *
   * @returns {Promise<Privilege>}
   */
  async getAclV2Privilege(id) {
    const privilege = await this.#privilegeDb.first(id)
    if (privilege === undefined) {
      throw noSuchObject(id, 'privilege')
    }

    return privilege
  }

  /**
   * @returns {Promise<Privilege[]>}
   */
  getAclV2Privileges() {
    // @ts-ignore typed as Promise<void>...
    return this.#privilegeDb.get()
  }
  // === Privilege
  // === UserRole
  /**
   *
   * Attach a role to a user
   *
   * @param {XoUser['id']} userId
   * @param {Role['id']} roleId
   *
   * @returns {Promise<UserRole>}
   */
  async addAclV2UserRole(userId, roleId) {
    /**
     * @type {UserRole}
     */
    const userRole = await this.#userRoleDb._get({ userId, roleId })

    if (userRole !== undefined) {
      throw objectAlreadyExists({ objectId: userRole.id, objectType: 'userRole' })
    }

    return this.#userRoleDb.add({ userId, roleId })
  }

  /**
   *
   * Detach a role from a user
   *
   * @param {XoUser['id']} userId
   * @param {Role['id']} roleId
   *
   * @returns {Promise<boolean>}
   */
  async deleteAclV2UserRole(userId, roleId) {
    /**
     * @type {UserRole}
     */
    const userRole = await this.#userRoleDb._get({ userId, roleId })

    if (userRole === undefined) {
      throw noSuchObject(`userId:${userId} and roleId:${roleId}`, 'userRole')
    }

    return this.#userRoleDb.remove(userRole.id)
  }
  // === UserRole
  // === GroupRole
  /**
   *
   * Attach a role to a group
   *
   * @param {XoGroup['id']} groupId
   * @param {Role['id']} roleId
   *
   * @returns {Promise<UserRole>}
   */
  async addAclV2GroupRole(groupId, roleId) {
    /**
     * @type {GroupRole}
     */
    const groupRole = await this.#groupRoleDb._get({ groupId, roleId })

    if (groupRole !== undefined) {
      throw objectAlreadyExists({ objectId: groupRole.id, objectType: 'groupRole' })
    }

    return this.#groupRoleDb.add({ groupId, roleId })
  }

  /**
   *
   * Detach a role from a group
   *
   * @param {XoGroup['id']} groupId
   * @param {Role['id']} roleId
   *
   * @returns {Promise<boolean>}
   */
  async deleteAclV2GroupRole(groupId, roleId) {
    /**
     * @type {UserRole}
     */
    const groupRole = await this.#groupRoleDb._get({ groupId, roleId })

    if (groupRole === undefined) {
      throw noSuchObject(`groupId:${groupId} and roleId:${roleId}`, 'groupRole')
    }

    return this.#groupRoleDb.remove(groupRole.id)
  }
  // === GroupRole

  /**
   * @param {Role['id']} roleId
   * @returns {Promise<Privilege[]>}
   */
  async getAclV2RolePrivileges(roleId) {
    const role = await this.getAclV2Role(roleId)
    return this.#privilegeDb._get({ roleId: role.id })
  }

  /**
   * @param {XoUser['id']} userId
   * @returns {Promise<Role[]>}
   */
  async getAclV2UserRoles(userId) {
    /** @type {XoUser} */
    const user = await this._app.getUser(userId)

    const groupRoles = (await Promise.all(user.groups.map(groupId => this.getAclV2GroupRoles(groupId)))).flat()

    /** @type {UserRole[]} */
    const dbUserRoles = await this.#userRoleDb._get({ userId: user.id })
    const userRoles = await Promise.all(dbUserRoles.map(dbUserRole => this.getAclV2Role(dbUserRole.roleId)))

    return [...groupRoles, ...userRoles]
  }

  /**
   * @param {XoUser['id']} userId
   * @returns {Promise<Privilege[]>}
   */
  async getAclV2UserPrivileges(userId) {
    const roles = await this.getAclV2UserRoles(userId)
    return (await Promise.all(roles.map(role => this.getAclV2RolePrivileges(role.id)))).flat()
  }

  /**
   * @param {XoGroup['id']} groupId
   * @returns {Promise<Role[]>}
   */
  async getAclV2GroupRoles(groupId) {
    /** @type {GroupRole[]} */
    const dbGroupRoles = await this.#groupRoleDb._get({ groupId })

    return Promise.all(dbGroupRoles.map(dbGroupRole => this.getAclV2Role(dbGroupRole.roleId)))
  }
}
