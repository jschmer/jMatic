describe('jMatic', function () {
    var elm, scope;

    // load the tabs code
    beforeEach(module('jMaticApp'));

    // load the templates
    beforeEach(module('templates'));

    it('should test this', inject(function ($compile, $rootScope) {
        expect(2).toBe(2);
        expect('Text').toBe('Text');
    }));
});