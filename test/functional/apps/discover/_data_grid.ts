/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import expect from '@kbn/expect';

export default function({
  getService,
  getPageObjects,
}: {
  getService: (service: string) => any;
  getPageObjects: (pageObjects: string[]) => any;
}) {
  describe('discover data grid tests', function describeDiscoverDataGrid() {
    const esArchiver = getService('esArchiver');
    const PageObjects = getPageObjects(['common', 'discover', 'timePicker']);
    const kibanaServer = getService('kibanaServer');
    const defaultSettings = { defaultIndex: 'logstash-*' };
    const testSubjects = getService('testSubjects');

    before(async function() {
      await esArchiver.load('discover');
      await esArchiver.loadIfNeeded('logstash_functional');
      await kibanaServer.uiSettings.replace(defaultSettings);
      await PageObjects.common.navigateToApp('discover');
      await PageObjects.timePicker.setDefaultAbsoluteRange();
    });

    it('can add fields to the table', async function() {
      const getTitles = async () =>
        (await testSubjects.getVisibleText('dataGridHeader')).replace(/\s|\r?\n|\r/g, ' ');

      expect(await getTitles()).to.be('Time _source');

      await PageObjects.discover.clickFieldListItemAdd('bytes');
      expect(await getTitles()).to.be('Time bytes');

      await PageObjects.discover.clickFieldListItemAdd('agent');
      expect(await getTitles()).to.be('Time bytes agent');

      await PageObjects.discover.clickFieldListItemAdd('bytes');
      expect(await getTitles()).to.be('Time agent');

      await PageObjects.discover.clickFieldListItemAdd('agent');
      expect(await getTitles()).to.be('Time _source');
    });
  });
}
